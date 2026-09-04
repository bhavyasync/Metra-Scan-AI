import cv2


def calculate_blur(image):

    gray = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2GRAY
    )

    score = cv2.Laplacian(
        gray,
        cv2.CV_64F
    ).var()

    return score


def is_image_readable(image):

    blur_score = calculate_blur(image)

    if blur_score < 80:

        return {
            "readable": False,
            "message":
                "Image is too blurry. Please capture again.",
            "blur_score":
                blur_score
        }

    return {
        "readable": True,
        "blur_score":
            blur_score
    }