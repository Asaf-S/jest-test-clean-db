let templateDbName: string = '';

export function getGeneratedTemplateDbName() {
  if (!templateDbName) {
    templateDbName = new Date()
      .toISOString()
      .substring(0, 23)
      .replace(/[-T:.]/g, '');
  }
  return templateDbName;
}