declare module "mammoth/mammoth.browser" {
  export type MammothResult = { value: string; messages: Array<{ type: string; message: string }> };
  const mammoth: {
    extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<MammothResult>;
  };
  export default mammoth;
}
