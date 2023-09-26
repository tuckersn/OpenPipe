import { Button, Icon, useDisclosure, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { BsTrash } from "react-icons/bs";

import { useHandledAsyncCallback, useFineTune } from "~/utils/hooks";
import DeleteFineTuneDialog from "./DeleteFineTuneDialog";

const DeleteFineTuneButton = ({ closeDrawer }: { closeDrawer: () => void }) => {
  const fineTune = useFineTune();
  const router = useRouter();

  const disclosure = useDisclosure();

  const [onDelete] = useHandledAsyncCallback(async () => {
    await router.push({ pathname: "/fine-tunes" });
    closeDrawer();
  }, [router, closeDrawer]);

  if (!fineTune.data) return null;

  const { id, slug } = fineTune.data;

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        colorScheme="red"
        fontWeight="normal"
        onClick={disclosure.onOpen}
      >
        <Icon as={BsTrash} boxSize={4} />
        <Text ml={2}>Delete Model</Text>
      </Button>

      {id && slug && (
        <DeleteFineTuneDialog
          fineTuneId={id}
          fineTuneSlug={slug}
          onDelete={onDelete}
          disclosure={disclosure}
        />
      )}
    </>
  );
};

export default DeleteFineTuneButton;
