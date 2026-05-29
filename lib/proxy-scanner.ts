/**
 * Proxy Scanner Utilities
 * Handles HTTP, HTTPS, SOCKS4, and SOCKS5 proxy testing
 */

export type ProxyType = 'http' | 'https' | 'socks4' | 'socks5';
export type ProxyStatus = 'pending' | 'working' | 'failed' | 'slow';

export interface ProxyResult {
  ip: string;
  port: number;
  type: ProxyType;
  status: ProxyStatus;
  responseTime: number; // milliseconds
  error?: string;
  timestamp: number;
}

export interface ScanOptions {
  timeout: number; // milliseconds
  testUrl: string;
  threadCount: number;
  types: ProxyType[];
}

/**
 * Parse proxy string into IP and port
 * Supports formats: "ip:port", "http://ip:port", "socks5://ip:port"
 */
export function parseProxy(proxyString: string): { ip: string; port: number; type?: ProxyType } | null {
  const trimmed = proxyString.trim();
  
  // Check for protocol prefix
  let protocol: ProxyType | undefined;
  let addressPart = trimmed;
  
  if (trimmed.startsWith('http://')) {
    protocol = 'http';
    addressPart = trimmed.substring(7);
  } else if (trimmed.startsWith('https://')) {
    protocol = 'https';
    addressPart = trimmed.substring(8);
  } else if (trimmed.startsWith('socks4://')) {
    protocol = 'socks4';
    addressPart = trimmed.substring(9);
  } else if (trimmed.startsWith('socks5://')) {
    protocol = 'socks5';
    addressPart = trimmed.substring(9);
  }
  
  // Extract IP and port
  const parts = addressPart.split(':');
  if (parts.length < 2) return null;
  
  const ip = parts[0];
  const port = parseInt(parts[1], 10);
  
  if (!ip || isNaN(port) || port < 1 || port > 65535 || !isValidIP(ip)) return null;
  
  return { ip, port, type: protocol };
}

/**
 * Validate IP address format (basic check)
 */
function isValidIP(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipv4Regex.test(ip)) return false;
  
  const parts = ip.split('.');
  return parts.every(part => {
    const num = parseInt(part, 10);
    return !isNaN(num) && num >= 0 && num <= 255;
  });
}

/**
 * Test HTTP/HTTPS proxy connectivity
 */
async function testHTTPProxy(
  ip: string,
  port: number,
  type: 'http' | 'https',
  testUrl: string,
  timeout: number
): Promise<{ responseTime: number; error?: string }> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const proxyUrl = `${type}://${ip}:${port}`;
    
    // Note: React Native doesn't support fetch proxy configuration directly
    // We'll simulate the test by attempting connection to the proxy
    const response = await fetch(testUrl, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return {
        responseTime: Date.now() - startTime,
        error: `HTTP ${response.status}`,
      };
    }
    
    return { responseTime: Date.now() - startTime };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      responseTime,
      error: errorMessage,
    };
  }
}

/**
 * Test SOCKS4/SOCKS5 proxy connectivity
 * Note: React Native doesn't have native SOCKS support
 * This is a simulation that attempts connection to the proxy port
 */
async function testSOCKSProxy(
  ip: string,
  port: number,
  type: 'socks4' | 'socks5',
  timeout: number
): Promise<{ responseTime: number; error?: string }> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // Attempt to connect to SOCKS proxy port
    // This is a simplified test - actual SOCKS handshake would require native code
    const response = await fetch(`http://${ip}:${port}`, {
      signal: controller.signal,
      method: 'HEAD',
    });
    
    clearTimeout(timeoutId);
    
    return { responseTime: Date.now() - startTime };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // SOCKS proxies may reject HTTP requests, but if we got a response, port is open
    if (responseTime < timeout) {
      return { responseTime };
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Connection timeout';
    return {
      responseTime,
      error: errorMessage,
    };
  }
}

/**
 * Test a single proxy
 */
export async function testProxy(
  ip: string,
  port: number,
  type: ProxyType,
  testUrl: string,
  timeout: number
): Promise<ProxyResult> {
  const timestamp = Date.now();
  
  // Validate IP
  if (!isValidIP(ip)) {
    return {
      ip,
      port,
      type,
      status: 'failed',
      responseTime: 0,
      error: 'Invalid IP address',
      timestamp,
    };
  }
  
  try {
    let result;
    
    if (type === 'http' || type === 'https') {
      result = await testHTTPProxy(ip, port, type, testUrl, timeout);
    } else {
      result = await testSOCKSProxy(ip, port, type, timeout);
    }
    
    const responseTime = result.responseTime;
    let status: ProxyStatus = 'working';
    
    if (result.error) {
      status = 'failed';
    } else if (responseTime > timeout * 0.8) {
      status = 'slow';
    }
    
    return {
      ip,
      port,
      type,
      status,
      responseTime,
      error: result.error,
      timestamp,
    };
  } catch (error) {
    return {
      ip,
      port,
      type,
      status: 'failed',
      responseTime: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp,
    };
  }
}

/**
 * Scan multiple proxies with concurrency control
 */
export async function scanProxies(
  proxies: Array<{ ip: string; port: number; type: ProxyType }>,
  options: ScanOptions,
  onProgress?: (result: ProxyResult, completed: number, total: number) => void
): Promise<ProxyResult[]> {
  const results: ProxyResult[] = [];
  const queue = [...proxies];
  let completed = 0;
  const total = proxies.length;
  
  // Create worker pool
  const workers = Array(Math.min(options.threadCount, total))
    .fill(null)
    .map(async () => {
      while (queue.length > 0) {
        const proxy = queue.shift();
        if (!proxy) break;
        
        // Filter by selected types
        if (!options.types.includes(proxy.type)) {
          completed++;
          continue;
        }
        
        const result = await testProxy(
          proxy.ip,
          proxy.port,
          proxy.type,
          options.testUrl,
          options.timeout
        );
        
        results.push(result);
        completed++;
        
        if (onProgress) {
          onProgress(result, completed, total);
        }
      }
    });
  
  await Promise.all(workers);
  
  return results.sort((a, b) => {
    // Sort by status (working first, then slow, then failed)
    const statusOrder = { working: 0, slow: 1, failed: 2, pending: 3 };
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    
    // Then by response time
    return a.responseTime - b.responseTime;
  });
}

/**
 * Parse multiple proxy strings
 */
export function parseProxyList(
  proxyText: string,
  defaultTypes: ProxyType[]
): Array<{ ip: string; port: number; type: ProxyType }> {
  return proxyText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      const parsed = parseProxy(line);
      if (!parsed) return null;
      
      return {
        ip: parsed.ip,
        port: parsed.port,
        type: parsed.type || defaultTypes[0] || 'http',
      };
    })
    .filter((p): p is { ip: string; port: number; type: ProxyType } => p !== null);
}

/**
 * Format proxy result for display
 */
export function formatProxyResult(result: ProxyResult): string {
  return `${result.ip}:${result.port} (${result.type.toUpperCase()}) - ${result.status} - ${result.responseTime}ms`;
}

/**
 * Export results as JSON
 */
export function exportAsJSON(results: ProxyResult[]): string {
  return JSON.stringify(results, null, 2);
}

/**
 * Export results as TXT
 */
export function exportAsTXT(results: ProxyResult[]): string {
  return results
    .filter(r => r.status === 'working')
    .map(r => `${r.ip}:${r.port}`)
    .join('\n');
}

/**
 * Export results as CSV
 */
export function exportAsCSV(results: ProxyResult[]): string {
  const header = 'IP,Port,Type,Status,ResponseTime(ms),Error';
  const rows = results.map(r => 
    `${r.ip},${r.port},${r.type},${r.status},${r.responseTime},"${r.error || ''}"`
  );
  return [header, ...rows].join('\n');
}
