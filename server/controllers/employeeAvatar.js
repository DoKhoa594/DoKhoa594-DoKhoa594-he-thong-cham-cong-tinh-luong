export function isEmployeeAvatar(avatar) {
  if (avatar === null) return true;
  const image = typeof avatar === "string" && avatar.length <= 1398127
    ? /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(avatar)
    : null;
  const bytes = image && Buffer.from(image[2], "base64");
  return Boolean(bytes && bytes.length <= 1024 * 1024 &&
    bytes.toString("base64") === image[2] && (
      (image[1] === "jpeg" && bytes.subarray(0, 3).toString("hex") === "ffd8ff") ||
      (image[1] === "png" && bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a") ||
      (image[1] === "webp" && bytes.toString("ascii", 0, 4) === "RIFF" &&
        bytes.toString("ascii", 8, 12) === "WEBP")
    ));
}
