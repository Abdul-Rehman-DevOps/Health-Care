/**
 * Print via a hidden iframe so:
 * - document.title becomes the default PDF file name (patient_visitNo)
 * - the printed footer URL is blank (not the app / ngrok URL)
 */
import { resolvePublicUrl } from './hospital-logo';

function absolutizeImages(root: ParentNode): void {
  root.querySelectorAll('img[src]').forEach((img) => {
    const el = img as HTMLImageElement;
    const src = el.getAttribute('src');
    if (!src || /^https?:\/\//i.test(src) || src.startsWith('data:')) return;
    el.src = resolvePublicUrl(src);
  });
}

function waitForImages(doc: Document): Promise<void> {
  const imgs = Array.from(doc.querySelectorAll('img'));
  if (imgs.length === 0) return Promise.resolve();
  return Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.addEventListener('load', () => resolve(), { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
        })
    )
  ).then(() => undefined);
}

export function printElementByIframe(
  selector: string,
  documentTitle: string,
  onFinished?: () => void
): void {
  const source = document.querySelector(selector);
  if (!source) {
    window.print();
    onFinished?.();
    return;
  }

  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', 'Print');
  iframe.style.cssText =
    'position:fixed;left:0;top:0;width:0;height:0;border:0;opacity:0;pointer-events:none;';
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = iframe.contentDocument;
  if (!win || !doc) {
    iframe.remove();
    onFinished?.();
    return;
  }

  const escapedTitle = documentTitle
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const baseHref = `${window.location.origin}${import.meta.env.BASE_URL || '/'}`;
  doc.open();
  doc.write(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><base href="${baseHref}"><title>${escapedTitle}</title></head><body></body></html>`
  );
  doc.close();

  document.querySelectorAll('link[rel="stylesheet"]').forEach((node) => {
    const link = node.cloneNode(true) as HTMLLinkElement;
    if (link.href && !/^https?:\/\//i.test(link.getAttribute('href') || '')) {
      link.href = resolvePublicUrl(link.getAttribute('href') || link.href);
    }
    doc.head.appendChild(link);
  });
  document.querySelectorAll('style').forEach((node) => {
    doc.head.appendChild(node.cloneNode(true));
  });

  const wrapper = doc.createElement('div');
  wrapper.innerHTML = source.innerHTML;
  absolutizeImages(wrapper);
  doc.body.appendChild(wrapper);

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    win.removeEventListener('afterprint', finish);
    setTimeout(() => iframe.remove(), 200);
    onFinished?.();
  };

  let printed = false;
  const doPrint = async () => {
    if (printed) return;
    printed = true;
    absolutizeImages(doc);
    await waitForImages(doc);
    doc.title = documentTitle;
    win.focus();
    win.print();
    win.addEventListener('afterprint', finish);
    setTimeout(finish, 120_000);
  };

  const links = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'));
  let started = false;
  const startOnce = () => {
    if (started) return;
    started = true;
    requestAnimationFrame(() => void doPrint());
  };

  if (links.length === 0) {
    startOnce();
    return;
  }

  let pending = links.length;
  const onSheetDone = () => {
    pending -= 1;
    if (pending <= 0) startOnce();
  };

  links.forEach((link) => {
    link.addEventListener('load', onSheetDone);
    link.addEventListener('error', onSheetDone);
  });

  setTimeout(() => {
    if (!started) startOnce();
  }, 2500);
}
