export type FooterStatementPhrase = {
  desktop: readonly string[];
  mobile: readonly string[];
};

export function getFooterStatementLines(phrase: FooterStatementPhrase, isMobile: boolean) {
  return isMobile ? phrase.mobile : phrase.desktop;
}
