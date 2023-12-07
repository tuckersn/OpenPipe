from enum import Enum


class GetTrainingInfoResponse200BaseModel(str, Enum):
    GPT_3_5_TURBO = "GPT_3_5_TURBO"
    LLAMA2_13B = "LLAMA2_13b"
    LLAMA2_7B = "LLAMA2_7b"
    MISTRAL_7B = "MISTRAL_7b"
    OPENHERMES_2_5 = "OPENHERMES_2_5"
    ZEPHYR_7B_BETA = "ZEPHYR_7B_BETA"

    def __str__(self) -> str:
        return str(self.value)
