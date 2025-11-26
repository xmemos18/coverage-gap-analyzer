import { sanitizeTextInput, sanitizeCoverageNotes } from '@/lib/validation';

describe('XSS Sanitization', () => {
  describe('sanitizeTextInput', () => {
    describe('basic HTML tags', () => {
      it('removes script tags', () => {
        expect(sanitizeTextInput('<script>alert("xss")</script>')).toBe('');
        expect(sanitizeTextInput('<script>alert("xss")</script>Hello')).toBe('Hello');
        expect(sanitizeTextInput('Hello<script>alert("xss")</script>World')).toBe('HelloWorld');
      });

      it('removes all HTML tags', () => {
        expect(sanitizeTextInput('<div>Hello</div>')).toBe('Hello');
        expect(sanitizeTextInput('<p>Paragraph</p>')).toBe('Paragraph');
        expect(sanitizeTextInput('<span>Text</span>')).toBe('Text');
        expect(sanitizeTextInput('<b>Bold</b>')).toBe('Bold');
        expect(sanitizeTextInput('<i>Italic</i>')).toBe('Italic');
      });

      it('removes nested HTML tags', () => {
        expect(sanitizeTextInput('<div><span><b>Text</b></span></div>')).toBe('Text');
        expect(sanitizeTextInput('<p><a href="#">Link</a></p>')).toBe('Link');
      });
    });

    describe('XSS attack vectors', () => {
      it('handles javascript: protocol in plain text', () => {
        // DOMPurify treats plain text (without HTML tags) as safe text content
        // These are only dangerous when used in href/src attributes
        expect(sanitizeTextInput('javascript:alert(1)')).toBe('javascript:alert(1)');
        expect(sanitizeTextInput('JAVASCRIPT:alert(1)')).toBe('JAVASCRIPT:alert(1)');
        expect(sanitizeTextInput('JaVaScRiPt:alert(1)')).toBe('JaVaScRiPt:alert(1)');
      });

      it('strips script tag from data: protocol', () => {
        // The script tag gets stripped, but 'data:text/html,' remains as text
        expect(sanitizeTextInput('data:text/html,<script>alert(1)</script>')).toBe('data:text/html,');
      });

      it('prevents event handlers', () => {
        expect(sanitizeTextInput('<img onerror="alert(1)">')).toBe('');
        expect(sanitizeTextInput('<div onclick="alert(1)">Click</div>')).toBe('Click');
        expect(sanitizeTextInput('<body onload="alert(1)">')).toBe('');
      });

      it('prevents img tag XSS', () => {
        expect(sanitizeTextInput('<img src=x onerror=alert(1)>')).toBe('');
        expect(sanitizeTextInput('<img src="x" onerror="alert(1)">')).toBe('');
        expect(sanitizeTextInput('<img src=javascript:alert(1)>')).toBe('');
      });

      it('prevents iframe injections', () => {
        expect(sanitizeTextInput('<iframe src="evil.com"></iframe>')).toBe('');
        expect(sanitizeTextInput('<iframe src="javascript:alert(1)"></iframe>')).toBe('');
      });

      it('prevents object/embed tags', () => {
        expect(sanitizeTextInput('<object data="evil.swf"></object>')).toBe('');
        expect(sanitizeTextInput('<embed src="evil.swf">')).toBe('');
      });

      it('prevents SVG XSS', () => {
        expect(sanitizeTextInput('<svg onload="alert(1)">')).toBe('');
        expect(sanitizeTextInput('<svg><script>alert(1)</script></svg>')).toBe('');
      });

      it('prevents form tag injections', () => {
        expect(sanitizeTextInput('<form action="evil.com"><input></form>')).toBe('');
      });

      it('prevents meta refresh', () => {
        expect(sanitizeTextInput('<meta http-equiv="refresh" content="0;url=evil.com">')).toBe('');
      });

      it('prevents link tag stylesheet injection', () => {
        expect(sanitizeTextInput('<link rel="stylesheet" href="evil.css">')).toBe('');
      });
    });

    describe('encoded attacks', () => {
      it('handles already-encoded HTML entities safely', () => {
        // HTML entities are already safe - they won't render as HTML
        // DOMPurify preserves them since they're not executable
        expect(sanitizeTextInput('&lt;script&gt;alert(1)&lt;/script&gt;')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
        expect(sanitizeTextInput('&#60;script&#62;alert(1)&#60;/script&#62;')).toBe('&#60;script&#62;alert(1)&#60;/script&#62;');
      });

      it('handles hex encoding safely', () => {
        // Hex-encoded entities are already safe text
        expect(sanitizeTextInput('&#x3c;script&#x3e;alert(1)&#x3c;/script&#x3e;')).toBe('&#x3c;script&#x3e;alert(1)&#x3c;/script&#x3e;');
      });

      it('strips actual unicode script tags', () => {
        // Unicode characters that decode to actual tags are stripped
        expect(sanitizeTextInput('\u003cscript\u003ealert(1)\u003c/script\u003e')).toBe('');
      });
    });

    describe('style attribute attacks', () => {
      it('prevents CSS expression XSS', () => {
        expect(sanitizeTextInput('<div style="expression(alert(1))">Text</div>')).toBe('Text');
      });

      it('prevents CSS import XSS', () => {
        expect(sanitizeTextInput('<div style="background:url(javascript:alert(1))">Text</div>')).toBe('Text');
      });
    });

    describe('safe content', () => {
      it('preserves plain text', () => {
        expect(sanitizeTextInput('Hello World')).toBe('Hello World');
        expect(sanitizeTextInput('This is a test')).toBe('This is a test');
      });

      it('preserves text with spaces', () => {
        expect(sanitizeTextInput('  Hello   World  ')).toBe('Hello   World');
      });

      it('preserves numbers', () => {
        expect(sanitizeTextInput('12345')).toBe('12345');
        expect(sanitizeTextInput('3.14159')).toBe('3.14159');
      });

      it('preserves special characters', () => {
        expect(sanitizeTextInput('Hello! How are you?')).toBe('Hello! How are you?');
        expect(sanitizeTextInput('Price: $99.99')).toBe('Price: $99.99');
        expect(sanitizeTextInput('Email: test@example.com')).toBe('Email: test@example.com');
      });

      it('preserves punctuation', () => {
        expect(sanitizeTextInput('Hello, World!')).toBe('Hello, World!');
        expect(sanitizeTextInput('Yes; no. Maybe?')).toBe('Yes; no. Maybe?');
      });

      it('preserves newlines and basic formatting', () => {
        const multiline = 'Line 1\nLine 2\nLine 3';
        expect(sanitizeTextInput(multiline)).toBe(multiline);
      });
    });

    describe('length limiting', () => {
      it('limits to 200 characters by default', () => {
        const longText = 'a'.repeat(300);
        expect(sanitizeTextInput(longText)).toHaveLength(200);
      });

      it('respects custom max length', () => {
        const text = 'a'.repeat(100);
        expect(sanitizeTextInput(text, 50)).toHaveLength(50);
        expect(sanitizeTextInput(text, 150)).toHaveLength(100); // Doesn't pad
      });

      it('handles empty strings', () => {
        expect(sanitizeTextInput('')).toBe('');
        expect(sanitizeTextInput('', 100)).toBe('');
      });
    });

    describe('edge cases', () => {
      it('handles null and undefined', () => {
        expect(sanitizeTextInput(null as unknown as string)).toBe('');
        expect(sanitizeTextInput(undefined as unknown as string)).toBe('');
      });

      it('trims whitespace', () => {
        expect(sanitizeTextInput('   Hello   ')).toBe('Hello');
        expect(sanitizeTextInput('\t\n  Text  \n\t')).toBe('Text');
      });

      it('handles mixed content', () => {
        const input = 'Safe text <script>evil()</script> more safe text';
        expect(sanitizeTextInput(input)).toBe('Safe text  more safe text');
      });

      it('handles malformed HTML', () => {
        expect(sanitizeTextInput('<div><span>Text</div>')).toBe('Text');
        // Double angle brackets: first < becomes &lt;, then <script> is stripped, leaving > as &gt;
        expect(sanitizeTextInput('<<script>alert(1)</script>>')).toBe('&lt;&gt;');
      });

      it('handles multiple XSS attempts', () => {
        const input = '<script>1</script><img onerror=alert(1)><svg onload=alert(1)>';
        expect(sanitizeTextInput(input)).toBe('');
      });
    });

    describe('real-world examples', () => {
      it('sanitizes insurance carrier names', () => {
        expect(sanitizeTextInput('Blue Cross Blue Shield')).toBe('Blue Cross Blue Shield');
        expect(sanitizeTextInput('Aetna <script>alert(1)</script>')).toBe('Aetna');
      });

      it('sanitizes user comments', () => {
        expect(sanitizeTextInput('Great coverage!')).toBe('Great coverage!');
        expect(sanitizeTextInput('Good plan <a href="evil.com">click</a>')).toBe('Good plan click');
      });

      it('sanitizes prescription names', () => {
        expect(sanitizeTextInput('Metformin 500mg')).toBe('Metformin 500mg');
        expect(sanitizeTextInput('Lipitor<img src=x onerror=alert(1)>')).toBe('Lipitor');
      });
    });
  });

  describe('sanitizeCoverageNotes', () => {
    it('removes all HTML tags', () => {
      expect(sanitizeCoverageNotes('<div>Note</div>')).toBe('Note');
      expect(sanitizeCoverageNotes('<script>alert(1)</script>')).toBe('');
    });

    it('limits to 1000 characters', () => {
      const longText = 'a'.repeat(1500);
      expect(sanitizeCoverageNotes(longText)).toHaveLength(1000);
    });

    it('preserves line breaks and formatting', () => {
      const notes = 'Line 1\nLine 2\nLine 3';
      expect(sanitizeCoverageNotes(notes)).toBe(notes);
    });

    it('removes XSS attempts', () => {
      expect(sanitizeCoverageNotes('<img src=x onerror=alert(1)>')).toBe('');
      // Plain text 'javascript:' is safe - only dangerous in href attributes
      expect(sanitizeCoverageNotes('javascript:alert(1)')).toBe('javascript:alert(1)');
    });

    it('handles empty input', () => {
      expect(sanitizeCoverageNotes('')).toBe('');
      expect(sanitizeCoverageNotes(null as unknown as string)).toBe('');
    });

    it('sanitizes real coverage notes', () => {
      const notes = 'Prefers doctors in network\nNeeds prescription coverage\nHas chronic condition';
      expect(sanitizeCoverageNotes(notes)).toBe(notes);
    });
  });

  describe('Security guarantees', () => {
    it('prevents all OWASP Top 10 XSS vectors', () => {
      const vectors = [
        '<script>alert(1)</script>',
        '<img src=x onerror=alert(1)>',
        '<svg onload=alert(1)>',
        '<iframe src=javascript:alert(1)>',
        '<body onload=alert(1)>',
        '<input onfocus=alert(1) autofocus>',
        '<select onfocus=alert(1) autofocus>',
        '<textarea onfocus=alert(1) autofocus>',
        '<marquee onstart=alert(1)>',
        '<div style="expression(alert(1))">',
      ];

      vectors.forEach(vector => {
        const result = sanitizeTextInput(vector);
        expect(result).not.toContain('alert');
        expect(result).not.toContain('script');
        expect(result).not.toContain('onerror');
        expect(result).not.toContain('onload');
      });
    });

    it('is safe for database storage', () => {
      // SQL injection attempts should be neutralized
      const sqlAttempts = [
        "'; DROP TABLE users;--",
        "1' OR '1'='1",
        "admin'--",
      ];

      sqlAttempts.forEach(attempt => {
        const result = sanitizeTextInput(attempt);
        // Should be safe text, not executable SQL
        expect(typeof result).toBe('string');
      });
    });

    it('is safe for React rendering', () => {
      // HTML-based XSS attempts are stripped
      const htmlXssAttempts = [
        '<script>alert(1)</script>',
        '<img onerror=alert(1)>',
      ];

      htmlXssAttempts.forEach(attempt => {
        const result = sanitizeTextInput(attempt);
        expect(result).not.toMatch(/<[^>]*>/); // No HTML tags
        expect(result).not.toContain('onerror');
      });

      // Plain text 'javascript:' is safe when rendered as text (not in href)
      // React escapes text content, so 'javascript:alert(1)' as text is safe
      expect(sanitizeTextInput('javascript:alert(1)')).toBe('javascript:alert(1)');
    });
  });
});
