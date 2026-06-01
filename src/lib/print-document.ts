/**
 * Print via a hidden iframe so:
 * - document.title becomes the default PDF file name (patient_visitNo)
 * - the printed footer URL is blank (not the app / ngrok URL)
 */
export function printElementByIframe(selector: string, documentTitle: string): void {
  const source = document.querySelector(selector);
  if (!source) {
    window.print();
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
    window.print();
    return;
  }

  const escapedTitle = documentTitle
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  doc.open();
  doc.write(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapedTitle}</title></head><body></body></html>`
  );
  doc.close();

  document.querySelectorAll('link[rel="stylesheet"]').forEach((node) => {
    doc.head.appendChild(node.cloneNode(true));
  });
  document.querySelectorAll('style').forEach((node) => {
    doc.head.appendChild(node.cloneNode(true));
  });

  const pageStyle = doc.createElement('style');
  pageStyle.textContent = `
    @page {
      size: A5 portrait;
      margin: 6mm;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
    }
    @media print {
      @page {
        size: A5 portrait;
        margin: 6mm;
      }
      .hc-print-page {
        display: flex;
        flex-direction: column;
        height: 198mm;
        max-height: 198mm;
        min-height: 198mm;
        overflow: hidden;
        page-break-inside: avoid;
        break-inside: avoid-page;
      }
      .hc-print-page--with-next {
        page-break-after: always;
        break-after: page;
      }
      .hc-print-page-break {
        page-break-before: always;
        break-before: page;
      }
      .hc-print-page-body {
        flex: 1 1 auto;
        min-height: 0;
        overflow: hidden;
      }
      .hc-print-footer,
      .hc-print-bill-footer {
        margin-top: auto;
        flex-shrink: 0;
      }
    }
  `;
  doc.head.appendChild(pageStyle);

  const wrapper = doc.createElement('div');
  wrapper.innerHTML = source.innerHTML;
  doc.body.appendChild(wrapper);

  const cleanup = () => {
    win.removeEventListener('afterprint', cleanup);
    setTimeout(() => iframe.remove(), 200);
  };

  const doPrint = () => {
    doc.title = documentTitle;
    win.focus();
    win.print();
    win.addEventListener('afterprint', cleanup);
    setTimeout(cleanup, 120_000);
  };

  const links = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'));
  if (links.length === 0) {
    requestAnimationFrame(doPrint);
    return;
  }

  let pending = links.length;
  const onSheetDone = () => {
    pending -= 1;
    if (pending <= 0) requestAnimationFrame(doPrint);
  };

  links.forEach((link) => {
    link.addEventListener('load', onSheetDone);
    link.addEventListener('error', onSheetDone);
  });

  setTimeout(() => requestAnimationFrame(doPrint), 2000);
}
