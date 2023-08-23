export enum FontSize {
  Title = 36,
  Subtitle1 = 24,
  Subtitle2 = 20,
  Description = 16,
  Body = 14,
  BodyDescription = 13,
  Caption = 12,
}

export enum FontWeight {
  Regular = 400,
  Medium = 500,
  Bold = 700,
}

export enum FontFamily {
  Roboto = '"Roboto", sans-serif',
}

export const typography = {
  size: FontSize,
  weight: FontWeight,
  family: FontFamily,
}
