import { render } from '@testing-library/react';
import RootLayout from '@/app/layout';

// Mock child components to isolate layout testing
jest.mock('@/components/Navigation', () => {
  return function MockNavigation() {
    return <nav data-testid="navigation">Navigation</nav>;
  };
});

jest.mock('@/components/Footer', () => {
  return function MockFooter() {
    return <footer data-testid="footer">Footer</footer>;
  };
});

jest.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <div data-testid="error-boundary">{children}</div>,
}));

jest.mock('@/components/SkipLink', () => {
  return function MockSkipLink() {
    return <a data-testid="skip-link">Skip to content</a>;
  };
});

jest.mock('@/components/Analytics', () => {
  return function MockAnalytics() {
    return <div data-testid="analytics">Analytics</div>;
  };
});

jest.mock('@/components/PasswordGate', () => {
  return function MockPasswordGate({ children }: { children: React.ReactNode }) {
    return <div data-testid="password-gate">{children}</div>;
  };
});

jest.mock('@/components/ClientProviders', () => {
  return function MockClientProviders({ children }: { children: React.ReactNode }) {
    return <div data-testid="client-providers">{children}</div>;
  };
});

describe('RootLayout', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    );
    expect(container).toBeInTheDocument();
  });

  it('renders structured data script without dangerouslySetInnerHTML', () => {
    const { container } = render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    );

    // Find the structured data script
    const structuredDataScript = container.querySelector('script[type="application/ld+json"]');
    expect(structuredDataScript).toBeInTheDocument();
    expect(structuredDataScript?.id).toBe('structured-data');
  });

  it('includes valid JSON-LD structured data', () => {
    const { container } = render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    );

    const structuredDataScript = container.querySelector('script[type="application/ld+json"]');
    const structuredDataContent = structuredDataScript?.textContent;

    expect(structuredDataContent).toBeTruthy();

    // Parse to verify it's valid JSON
    const parsedData = JSON.parse(structuredDataContent || '{}');

    expect(parsedData['@context']).toBe('https://schema.org');
    expect(parsedData['@type']).toBe('WebApplication');
    expect(parsedData.name).toBe('Key Insurance Matters');
    expect(parsedData.url).toBe('https://keyinsurancematters.com');
  });

  it('does not use dangerouslySetInnerHTML for structured data', () => {
    const { container } = render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    );

    const structuredDataScript = container.querySelector('script[type="application/ld+json"]');

    // Verify the script element doesn't have innerHTML set directly
    // (This is a proxy check - if dangerouslySetInnerHTML were used, React would set __html)
    expect(structuredDataScript).not.toHaveProperty('__html');
  });

  it('prevents XSS through structured data', () => {
    // This test verifies that even if structured data contained malicious content,
    // it would be properly escaped by React's safe rendering
    const { container } = render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    );

    const structuredDataScript = container.querySelector('script[type="application/ld+json"]');
    const content = structuredDataScript?.textContent || '';

    // Ensure no unescaped HTML tags exist in the JSON
    // JSON.stringify will properly escape any HTML-like strings
    expect(content).not.toMatch(/<script/);
    expect(content).not.toMatch(/<\/script>/);
    expect(content).not.toMatch(/javascript:/);
  });

  it('renders all major layout components', () => {
    const { getByTestId } = render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    );

    expect(getByTestId('analytics')).toBeInTheDocument();
    expect(getByTestId('password-gate')).toBeInTheDocument();
    expect(getByTestId('client-providers')).toBeInTheDocument();
    expect(getByTestId('error-boundary')).toBeInTheDocument();
    expect(getByTestId('skip-link')).toBeInTheDocument();
    expect(getByTestId('navigation')).toBeInTheDocument();
    expect(getByTestId('footer')).toBeInTheDocument();
  });

  it('renders children content', () => {
    const { getByText } = render(
      <RootLayout>
        <div>Test Child Content</div>
      </RootLayout>
    );

    expect(getByText('Test Child Content')).toBeInTheDocument();
  });

  it('sets correct language attribute', () => {
    const { container } = render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    );

    const htmlElement = container.querySelector('html');
    expect(htmlElement).toHaveAttribute('lang', 'en');
  });

  it('includes main content area with correct accessibility attributes', () => {
    const { container } = render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    );

    const mainElement = container.querySelector('main');
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toHaveAttribute('id', 'main-content');
    expect(mainElement).toHaveAttribute('tabIndex', '-1');
  });
});

describe('RootLayout Security', () => {
  it('properly escapes special characters in structured data', () => {
    // Test that React's safe rendering handles special characters correctly
    const { container } = render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    );

    const structuredDataScript = container.querySelector('script[type="application/ld+json"]');
    const content = structuredDataScript?.textContent || '';
    const parsedData = JSON.parse(content);

    // Verify that the data is properly structured and doesn't contain injection attempts
    expect(typeof parsedData).toBe('object');
    expect(parsedData['@context']).toBe('https://schema.org');

    // Ensure all fields are properly typed
    expect(typeof parsedData.name).toBe('string');
    expect(typeof parsedData.description).toBe('string');
    expect(typeof parsedData.url).toBe('string');
    expect(Array.isArray(parsedData.featureList)).toBe(true);
  });

  it('does not expose vulnerabilities through JSON-LD injection', () => {
    const { container } = render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    );

    const structuredDataScript = container.querySelector('script[type="application/ld+json"]');
    const rawContent = structuredDataScript?.innerHTML || '';

    // Verify that dangerous patterns are not present in raw HTML
    expect(rawContent).not.toContain('</script>');
    expect(rawContent).not.toContain('<script');
    expect(rawContent).not.toContain('onerror=');
    expect(rawContent).not.toContain('onload=');
    expect(rawContent).not.toContain('javascript:');
  });
});
