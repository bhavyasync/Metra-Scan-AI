import math


def estimate_character_height(
    bbox
):
    """
    Returns pixel height of detected text.
    """

    if not bbox or len(bbox) != 4:
        return None

    _, y1, _, y2 = bbox

    return abs(
        float(y2) - float(y1)
    )


def readability_level(
    pixel_height: float | None
):

    if pixel_height is None:
        return "UNKNOWN"

    if pixel_height < 12:
        return "VERY_SMALL"

    if pixel_height < 20:
        return "SMALL"

    if pixel_height < 32:
        return "READABLE"

    return "LARGE"


def estimate_relative_font_size(
    bbox,
    image_height
):

    height = estimate_character_height(
        bbox
    )

    if height is None:
        return None

    if image_height <= 0:
        return None

    return round(
        height / image_height,
        4
    )


def analyze_font(
    bbox,
    image_height
):

    relative_size = (
        estimate_relative_font_size(
            bbox,
            image_height
        )
    )

    height = estimate_character_height(
        bbox
    )

    return {
        "pixel_height": height,
        "relative_height":
            relative_size,
        "readability":
            readability_level(height),
        "physical_size_verified":
            False,
        "note": (
            "Physical legal font size cannot "
            "be verified from pixels alone unless "
            "package scale/calibration is available."
        ),
    }