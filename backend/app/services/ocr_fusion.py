import re
from collections import defaultdict


LEGAL_TERMS = [
    "mrp",
    "maximum retail price",
    "net",
    "weight",
    "quantity",
    "batch",
    "lot",
    "mfd",
    "mfg",
    "manufactured",
    "packed",
    "pkd",
    "best before",
    "expiry",
    "consumer care",
    "customer care",
    "importer",
    "packer",
]


def normalize(value: str) -> str:
    value = value.lower().strip()

    value = re.sub(
        r"[^a-z0-9₹@./%:+\- ]",
        "",
        value,
    )

    value = re.sub(
        r"\s+",
        " ",
        value,
    )

    return value


def keyword_score(text: str) -> float:

    normalized = normalize(text)

    matches = sum(
        1
        for term in LEGAL_TERMS
        if term in normalized
    )

    return min(
        matches / 3.0,
        1.0,
    )


def fuse(results):

    candidates = []

    for result in results:

        for word in result.get(
            "words",
            []
        ):

            text = word[
                "text"
            ].strip()

            if not text:
                continue

            score = (
                word.get(
                    "confidence",
                    0,
                )
                * 0.70
            )

            score += (
                keyword_score(text)
                * 0.30
            )

            candidates.append({
                **word,
                "fusion_score": score,
            })

    # Preserve all useful evidence.
    candidates.sort(
        key=lambda item:
            item["fusion_score"],
        reverse=True,
    )

    text = " ".join(
        item["text"]
        for item in candidates
    )

    return {
        "text": text,
        "words": candidates,
        "candidate_count": len(candidates),
    }