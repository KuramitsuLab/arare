
export const compile: (code: string) => Promise<void> = (code) => {
  return fetch('compile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/text; charset=utf-8',
    },
    body: code,
  }).then((res: Response) => {
    if (res.ok) {
      return res.text();
    }
    throw new Error(res.statusText);
  }).then((js: string) => {
    Function(js)(); // Eval javascript code
    if (!window['ArareCode']) {
      console.error(window['ArareCode']);
      throw new Error("Don\'t exist ArareCode in window.");
    }
  },
  ).catch((msg: string) => {
    console.error(msg);
  });
};

export const getSample: (path: string) => Promise<string> = (path) => {
  return fetch(`sample/${path}`, {
    method: 'GET',
  }).then((res: Response) => {
    if (res.ok) {
      return res.text();
    }
    throw new Error(res.statusText);
  }).then((sample: string) => {
    return sample;
  });
};
