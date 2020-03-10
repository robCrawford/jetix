
export function setDocTitle(title: string): Promise<void> {
  document.title = title;

  // Just an example success/failure
  return new Promise((resolve, reject): void => {
    if (document.title === title) {
      resolve();
    }
    reject();
  });
}
