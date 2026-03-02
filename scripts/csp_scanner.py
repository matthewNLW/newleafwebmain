import os
import re

def scan_directory(directory):
    external_urls = {
        'script-src': set(),
        'style-src': set(),
        'img-src': set(),
        'font-src': set(),
        'connect-src': set(),
        'frame-src': set(),
    }
    inline_content = {
        'scripts': False,
        'styles': False,
    }

    # Regex for external URLs
    url_pattern = re.compile(r'https?://[^\s\'"<>]+')

    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.html', '.js', '.css')):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()

                    # Find all URLs
                    urls = url_pattern.findall(content)
                    for url in urls:
                        domain = re.match(r'https?://[^/]+', url).group(0)

                        # Heuristic categorization
                        if '.js' in url or 'script' in content[content.find(url)-20:content.find(url)]:
                             external_urls['script-src'].add(domain)
                        if '.css' in url or 'stylesheet' in content[content.find(url)-50:content.find(url)]:
                             external_urls['style-src'].add(domain)
                        if any(ext in url.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp']):
                             external_urls['img-src'].add(domain)
                        if any(ext in url.lower() for ext in ['.woff', '.woff2', '.ttf', '.otf', '.eot']):
                             external_urls['font-src'].add(domain)
                        if 'fonts.googleapis.com' in domain:
                            external_urls['style-src'].add(domain)
                        if 'fonts.gstatic.com' in domain:
                            external_urls['font-src'].add(domain)
                        if 'challenges.cloudflare.com' in domain:
                            external_urls['script-src'].add(domain)
                            external_urls['frame-src'].add(domain)
                            external_urls['connect-src'].add(domain)
                        if 'calendly.com' in domain:
                            external_urls['script-src'].add(domain)
                            external_urls['style-src'].add(domain)
                            external_urls['frame-src'].add(domain)
                        if 'clarity.ms' in domain or 'bing.com' in domain:
                            external_urls['script-src'].add(domain)
                            external_urls['img-src'].add(domain)
                            external_urls['connect-src'].add(domain)

                    # Check for inline content
                    if file.endswith('.html'):
                        if '<script>' in content or '<script ' in content:
                            if not 'type="application/ld+json"' in content: # ignore JSON-LD
                                # Check if it has content and not just src
                                script_tags = re.findall(r'<script.*?>', content)
                                for tag in script_tags:
                                    if 'src=' not in tag:
                                        inline_content['scripts'] = True
                        if '<style' in content:
                            inline_content['styles'] = True
                        if ' style=' in content:
                            inline_content['styles'] = True

    return external_urls, inline_content

if __name__ == "__main__":
    urls, inline = scan_directory('src')
    print("External Domains Found:")
    for directive, domains in urls.items():
        print(f"  {directive}: {', '.join(sorted(domains))}")
    print("\nInline Content Found:")
    print(f"  Scripts: {inline['scripts']}")
    print(f"  Styles: {inline['styles']}")
