export const IMAGE_LOAD_MODE = {
  AUTO: "auto",
  ORIGINAL: "original",
};

export function nextImageLoadMode(mode) {
  return mode === IMAGE_LOAD_MODE.ORIGINAL ? IMAGE_LOAD_MODE.AUTO : IMAGE_LOAD_MODE.ORIGINAL;
}

export function getOriginalImageUrl(src) {
  return src || "";
}

export function parseWixMediaUrl() {
  return null;
}

export function buildTransformUrl(src) {
  return src || "";
}

export function buildSrcSet() {
  return undefined;
}

export function splitImageProps(props = {}) {
  const { width, height, sizes, quality, format, ...rest } = props;
  return { imgProps: rest, transformOptions: { width, height, sizes, quality, format } };
}

export const DEFAULT_TRANSFORM_WIDTH = 800;

export function getImagePreviewClassName() {
  return "";
}
