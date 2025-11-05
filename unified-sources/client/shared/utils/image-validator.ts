import { reduce } from "lodash";

export type RangeValidation = { min: number; max: number };
type Failure = {
  attribute: string;
  criterion: keyof RangeValidation;
};
type ValidationResult = {
  valid: boolean;
  failures: Failure[];
  dataUrl?: string;
};

export type FileValidations = Partial<Record<"fileSize", RangeValidation>>;
export type ImageValidations = Partial<Record<"width" | "height" | "aspectRatio", RangeValidation>>;
type Source = HTMLImageElement | File;
type Validators<SourceT extends Source> = SourceT extends HTMLImageElement ? ImageValidations : FileValidations;
type Attributes<SourceT extends Source> = Record<keyof Validators<SourceT>, (source: SourceT) => number>;

const validateRange = (quantity: number, attribute: string, range: RangeValidation): ValidationResult => {
  const passesMin = quantity >= range.min;
  const passesMax = quantity <= range.max;
  const valid = passesMin && passesMax;
  return {
    valid,
    failures: ([] as Failure[])
      .concat(passesMin ? [] : { attribute, criterion: "min" })
      .concat(passesMax ? [] : { attribute, criterion: "max" }),
  };
};

const fileAttributes: Attributes<File> = {
  fileSize: (file) => file.size,
};

const imageAttributes: Attributes<HTMLImageElement> = {
  width: (image) => image.width,
  height: (image) => image.height,
  aspectRatio: (image) => image.width / image.height,
};

const validateAttributes = <SourceT extends Source>(
  validations: Validators<SourceT>,
  attributes: Attributes<SourceT>,
  source: SourceT
): ValidationResult => {
  const seed: ValidationResult = { valid: true, failures: [] };
  return reduce(
    validations as { [key: string]: RangeValidation },
    (acc, range: RangeValidation, attr) => {
      const vs = validateRange(attributes[attr](source), attr, range);
      return {
        valid: acc.valid && vs.valid,
        failures: [...acc.failures, ...vs.failures],
      };
    },
    seed
  );
};

export function validateImage(
  image: File,
  fileValidations: FileValidations,
  imageValidations: ImageValidations
): Promise<ValidationResult> {
  const reader = new FileReader();
  const fileResults = validateAttributes(fileValidations, fileAttributes, image);
  if (!fileResults.valid) {
    return Promise.resolve(fileResults);
  }

  return new Promise((resolve, reject) => {
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const imageResults = validateAttributes(imageValidations, imageAttributes, image);
        if (imageResults.valid) {
          imageResults.dataUrl = image.src;
        }

        resolve(imageResults);
      };

      image.onerror = (error) => {
        reject(new Error(typeof error === "string" ? error : `Image ${image.name} failed to load.`));
      };

      image.src = reader.result as string; // The result of readAsDataURL is always a string
    };
    reader.readAsDataURL(image);
  });
}
