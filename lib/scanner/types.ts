export interface FormField {
  tag: string;
  type: string;
  name: string;
  hint: string; // name / id / placeholder — לזיהוי סוג השדה
  hasLabel: boolean;
  isContact: boolean;
}

export interface FormCheckbox {
  text: string;
  checked: boolean;
}

export interface FormInfo {
  label: string; // 'טופס "קבעו תור"'
  fields: FormField[];
  checkboxes: FormCheckbox[];
}

export interface PageData {
  url: string;
  label: string; // "דף הבית" / שם העמוד
  text: string; // הטקסט הנראה
  links: { href: string; text: string }[];
  forms: FormInfo[];
  imagesWithoutAlt: number;
  imageCount: number;
  scripts: string; // מקורות סקריפטים + קוד inline (מקוצר)
}

export interface SiteData {
  startUrl: string;
  finalUrl: string;
  pages: PageData[];
  privacyPage: PageData | null;
  likelyClientRendered: boolean;
}
