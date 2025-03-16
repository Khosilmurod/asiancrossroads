declare module 'clsx' {
  type ClassValue = string | number | boolean | undefined | null | ClassDictionary | ClassArray;
  
  interface ClassDictionary {
    [id: string]: any;
  }
  
  interface ClassArray extends Array<ClassValue> {}
  
  function clsx(...inputs: ClassValue[]): string;
  
  export = clsx;
} 