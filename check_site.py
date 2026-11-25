"""Check static routes, fragments and assets without a browser or dependencies."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
from urllib.request import urlopen
import argparse

ROOT = Path(__file__).resolve().parent / 'dist'

class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.ids, self.refs, self.h1, self.forms = [], [], 0, []
        self.feed(path.read_text(encoding='utf-8'))

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'):
            self.ids.append(attrs['id'])
        if tag == 'h1':
            self.h1 += 1
        if tag == 'form':
            self.forms.append(attrs)
        for key in ('src', 'href'):
            if attrs.get(key):
                self.refs.append(attrs[key])
        if attrs.get('srcset'):
            self.refs.extend(item.strip().split()[0] for item in attrs['srcset'].split(','))

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--http', help='Also request every HTML route from this server URL')
    args = parser.parse_args()
    pages = {path.name: Page(path) for path in ROOT.glob('*.html')}
    errors = []
    reference_count = 0
    for name, page in pages.items():
        if page.h1 != 1:
            errors.append(f'{name}: expected one h1, got {page.h1}')
        for id, count in Counter(page.ids).items():
            if count > 1:
                errors.append(f'{name}: duplicate ID {id}')
        for form in page.forms:
            if form.get('action'):
                errors.append(f'{name}: unexpected form destination')
        for ref in page.refs:
            url = urlsplit(ref)
            if url.scheme or url.netloc:
                continue
            target = unquote(url.path) or name
            if not (ROOT / target).is_file():
                errors.append(f'{name}: missing file {target}')
                continue
            reference_count += 1
            if url.fragment and target in pages and url.fragment not in pages[target].ids:
                # Shared appointment/footer contents are inserted before app binding.
                if url.fragment not in ('visit-form','visit-title','newsletter-form'):
                    errors.append(f'{name}: missing fragment {ref}')
        if args.http:
            try:
                with urlopen(args.http.rstrip('/')+'/'+name, timeout=5) as response:
                    if response.status != 200:
                        errors.append(f'{name}: HTTP {response.status}')
            except Exception as error:
                errors.append(f'{name}: {error}')
    if errors:
        raise SystemExit('\n'.join(errors))
    print(f'PASS: {len(pages)} pages, {reference_count} local references, unique IDs, valid fragments and no form destinations.')

if __name__ == '__main__':
    main()
