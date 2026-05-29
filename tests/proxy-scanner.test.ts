import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseProxy,
  parseProxyList,
  formatProxyResult,
  exportAsJSON,
  exportAsTXT,
  exportAsCSV,
  ProxyResult,
} from '../lib/proxy-scanner';

describe('Proxy Scanner Utilities', () => {
  describe('parseProxy', () => {
    it('should parse simple ip:port format', () => {
      const result = parseProxy('192.168.1.1:8080');
      expect(result).toEqual({ ip: '192.168.1.1', port: 8080 });
    });

    it('should parse http:// protocol format', () => {
      const result = parseProxy('http://192.168.1.1:8080');
      expect(result).toEqual({ ip: '192.168.1.1', port: 8080, type: 'http' });
    });

    it('should parse https:// protocol format', () => {
      const result = parseProxy('https://192.168.1.1:8080');
      expect(result).toEqual({ ip: '192.168.1.1', port: 8080, type: 'https' });
    });

    it('should parse socks4:// protocol format', () => {
      const result = parseProxy('socks4://192.168.1.1:1080');
      expect(result).toEqual({ ip: '192.168.1.1', port: 1080, type: 'socks4' });
    });

    it('should parse socks5:// protocol format', () => {
      const result = parseProxy('socks5://192.168.1.1:1080');
      expect(result).toEqual({ ip: '192.168.1.1', port: 1080, type: 'socks5' });
    });

    it('should return null for invalid IP', () => {
      const result = parseProxy('999.999.999.999:8080');
      expect(result).toBeNull();
    });

    it('should return null for invalid port', () => {
      const result = parseProxy('192.168.1.1:99999');
      expect(result).toBeNull();
    });

    it('should return null for missing port', () => {
      const result = parseProxy('192.168.1.1');
      expect(result).toBeNull();
    });

    it('should handle whitespace', () => {
      const result = parseProxy('  192.168.1.1:8080  ');
      expect(result).toEqual({ ip: '192.168.1.1', port: 8080 });
    });
  });

  describe('parseProxyList', () => {
    it('should parse multiple proxies', () => {
      const input = '192.168.1.1:8080\n192.168.1.2:8080\n192.168.1.3:8080';
      const result = parseProxyList(input, ['http']);
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ ip: '192.168.1.1', port: 8080, type: 'http' });
    });

    it('should skip empty lines', () => {
      const input = '192.168.1.1:8080\n\n192.168.1.2:8080';
      const result = parseProxyList(input, ['http']);
      expect(result).toHaveLength(2);
    });

    it('should skip invalid proxies', () => {
      const input = '192.168.1.1:8080\ninvalid\n192.168.1.2:8080';
      const result = parseProxyList(input, ['http']);
      expect(result).toHaveLength(2);
    });

    it('should use default type when not specified', () => {
      const input = '192.168.1.1:8080';
      const result = parseProxyList(input, ['socks5']);
      expect(result[0].type).toBe('socks5');
    });

    it('should preserve protocol type when specified', () => {
      const input = 'http://192.168.1.1:8080\nsocks5://192.168.1.2:1080';
      const result = parseProxyList(input, ['http']);
      expect(result[0].type).toBe('http');
      expect(result[1].type).toBe('socks5');
    });
  });

  describe('formatProxyResult', () => {
    it('should format proxy result correctly', () => {
      const result: ProxyResult = {
        ip: '192.168.1.1',
        port: 8080,
        type: 'http',
        status: 'working',
        responseTime: 150,
        timestamp: Date.now(),
      };
      const formatted = formatProxyResult(result);
      expect(formatted).toContain('192.168.1.1:8080');
      expect(formatted).toContain('HTTP');
      expect(formatted).toContain('working');
      expect(formatted).toContain('150ms');
    });
  });

  describe('exportAsJSON', () => {
    it('should export results as valid JSON', () => {
      const results: ProxyResult[] = [
        {
          ip: '192.168.1.1',
          port: 8080,
          type: 'http',
          status: 'working',
          responseTime: 150,
          timestamp: Date.now(),
        },
      ];
      const json = exportAsJSON(results);
      const parsed = JSON.parse(json);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].ip).toBe('192.168.1.1');
    });
  });

  describe('exportAsTXT', () => {
    it('should export only working proxies as TXT', () => {
      const results: ProxyResult[] = [
        {
          ip: '192.168.1.1',
          port: 8080,
          type: 'http',
          status: 'working',
          responseTime: 150,
          timestamp: Date.now(),
        },
        {
          ip: '192.168.1.2',
          port: 8080,
          type: 'http',
          status: 'failed',
          responseTime: 0,
          error: 'Connection timeout',
          timestamp: Date.now(),
        },
      ];
      const txt = exportAsTXT(results);
      expect(txt).toContain('192.168.1.1:8080');
      expect(txt).not.toContain('192.168.1.2:8080');
    });
  });

  describe('exportAsCSV', () => {
    it('should export results as CSV with header', () => {
      const results: ProxyResult[] = [
        {
          ip: '192.168.1.1',
          port: 8080,
          type: 'http',
          status: 'working',
          responseTime: 150,
          timestamp: Date.now(),
        },
      ];
      const csv = exportAsCSV(results);
      const lines = csv.split('\n');
      expect(lines[0]).toContain('IP,Port,Type,Status,ResponseTime');
      expect(lines[1]).toContain('192.168.1.1,8080,http,working,150');
    });

    it('should handle errors in CSV export', () => {
      const results: ProxyResult[] = [
        {
          ip: '192.168.1.1',
          port: 8080,
          type: 'http',
          status: 'failed',
          responseTime: 0,
          error: 'Connection timeout',
          timestamp: Date.now(),
        },
      ];
      const csv = exportAsCSV(results);
      expect(csv).toContain('Connection timeout');
    });
  });
});
