import { sql } from "kysely";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { kysely } from "~/server/db";
import { typedFineTune } from "~/types/dbColumns.types";
import { requireCanViewProject } from "~/utils/accessControl";
import dayjs from "~/utils/dayjs";

export const usageRouter = createTRPCRouter({
  stats: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        projectId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      await requireCanViewProject(input.projectId, ctx);

      const baseQuery = kysely
        .selectFrom("UsageLog as ul")
        .where("ul.projectId", "=", input.projectId)
        .where(sql`"ul"."createdAt"`, ">=", input.startDate)
        .where(sql`"ul"."createdAt"`, "<=", input.endDate);

      const finetunesQuery = kysely
        .selectFrom(
          baseQuery
            .innerJoin("FineTune as ft", "ft.id", "ul.fineTuneId")
            .where("ft.projectId", "=", input.projectId)
            .select(({ fn }) => [
              "ft.id as ftId",
              fn
                .sum(sql<number>`case when ul.type != 'TRAINING' then 1 else 0 end`)
                .as("numQueries"),
              fn
                .sum(sql<number>`case when ul.type != 'TRAINING' then ul."inputTokens" else 0 end`)
                .as("inputTokens"),
              fn
                .sum(sql<number>`case when ul.type != 'TRAINING' then ul."outputTokens" else 0 end`)
                .as("outputTokens"),
              fn
                .sum(sql<number>`case when ul.billable = false then 0 else ul."cost" end`)
                .as("cost"),
            ])
            .groupBy("ftId")
            .as("stats"),
        )
        .innerJoin("FineTune as ft", "ft.id", "stats.ftId")
        .selectAll("stats")
        .select(["ft.baseModel", "ft.provider", "ft.slug"])
        .orderBy("numQueries", "desc");

      const [periods, totals, fineTunes] = await Promise.all([
        // Return the stats group by day
        baseQuery
          .select((eb) => [
            sql<Date>`date_trunc('day', "ul"."createdAt")`.as("period"),
            sql<number>`count("ul"."id")::int`.as("numQueries"),
            eb.fn
              .sum(sql<number>`case when ul.type = 'TRAINING' then ul.cost else 0 end`)
              .as("trainingCost"),
            eb.fn
              .sum(
                sql<number>`case when ul.type != 'TRAINING' and ul.billable = true then ul.cost else 0 end`,
              )
              .as("inferenceCost"),
          ])
          .groupBy("period")
          .orderBy("period")
          .execute(),
        baseQuery
          .select(({ fn }) => [
            fn.sum(sql<number>`case when ul.billable = false then 0 else ul."cost" end`).as("cost"),
            fn
              .sum(sql<number>`case when ul.type = 'TRAINING' then ul.cost else 0 end`)
              .as("totalTrainingSpend"),
            fn
              .sum(
                sql<number>`case when ul.type != 'TRAINING' and ul.billable = true then ul.cost else 0 end`,
              )
              .as("totalInferenceSpend"),
            fn
              .sum(sql<number>`case when ul.type != 'TRAINING' then ul."inputTokens" else 0 end`)
              .as("totalInputTokens"),
            fn
              .sum(sql<number>`case when ul.type != 'TRAINING' then ul."outputTokens" else 0 end`)
              .as("totalOutputTokens"),
            fn
              .sum(
                sql<number>`case when ul.type = 'TRAINING' then ul."inputTokens" + ul."outputTokens" else 0 end`,
              )
              .as("totalTrainingTokens"),
            fn.count("ul.id").as("numQueries"),
          ])
          .executeTakeFirst(),
        finetunesQuery.select("ft.createdAt").execute(),
      ]);

      // Fillin in missing periods
      const startDate = dayjs(input.startDate);
      const endDate = dayjs(input.endDate);

      const allDates: Date[] = [];
      for (
        let date = startDate;
        date.isBefore(endDate) || date.isSame(endDate);
        date = date.add(1, "day")
      ) {
        allDates.push(date.toDate());
      }

      function createEmptyPeriod(date: Date): (typeof periods)[0] {
        return {
          period: date,
          numQueries: 0,
          trainingCost: 0,
          inferenceCost: 0,
        };
      }

      const combinedPeriods: typeof periods = allDates.map((date) => {
        const existingPeriod = periods.find((period) => dayjs(period.period).isSame(date, "day"));
        return existingPeriod || createEmptyPeriod(date);
      });

      return { periods: combinedPeriods, totals, fineTunes: fineTunes.map(typedFineTune) };
    }),
});
