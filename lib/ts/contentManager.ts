import EMPTY_DIAGRAM_XML from "./empty.bpmn?raw";
export class ContentManager {
  modeler: any;

  constructor(modeler: any) {
    this.modeler = modeler;
  }

  newDiagram() {
    return this.loadDiagram(EMPTY_DIAGRAM_XML);
  }

  async loadDiagram(content: string) {
    try {
      const { warnings } = await this.modeler.importXML(content);
      if (warnings && warnings.length) console.warn(warnings);
    } catch (err) {
      throw err;
    }
  }

  async exportDiagram(): Promise<string> {
    return (await this.modeler.saveXML({ format: true })).xml;
  }
}
