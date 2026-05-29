import { ScrollView, Text, View, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useProxyContext } from '@/lib/proxy-context';
import { parseProxyList, scanProxies, ProxyType } from '@/lib/proxy-scanner';
import { useCallback, useState, useEffect } from 'react';
import { useColors } from '@/hooks/use-colors';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

const PROXY_TYPES: ProxyType[] = ['http', 'https', 'socks4', 'socks5'];

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const {
    state,
    setProxyInput,
    setSelectedTypes,
    setScanOptions,
    startScan,
    addResult,
    updateProgress,
    completeScan,
    setError,
  } = useProxyContext();

  const [timeoutSeconds, setTimeoutSeconds] = useState(10);
  const [threadCount, setThreadCount] = useState(5);
  const [testUrl, setTestUrl] = useState('http://httpbin.org/ip');

  const handleProxyInputChange = useCallback((text: string) => {
    setProxyInput(text);
  }, [setProxyInput]);

  const toggleProxyType = useCallback((type: ProxyType) => {
    const newTypes = state.selectedTypes.includes(type)
      ? state.selectedTypes.filter(t => t !== type)
      : [...state.selectedTypes, type];
    
    if (newTypes.length > 0) {
      setSelectedTypes(newTypes);
    }
  }, [state.selectedTypes, setSelectedTypes]);

  const handleStartScan = useCallback(async () => {
    if (!state.proxyInput.trim()) {
      setError('Please enter at least one proxy');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const proxies = parseProxyList(state.proxyInput, state.selectedTypes);
      
      if (proxies.length === 0) {
        setError('No valid proxies found. Use format: ip:port or protocol://ip:port');
        return;
      }

      // Update scan options
      setScanOptions({
        timeout: timeoutSeconds * 1000,
        testUrl,
        threadCount,
        types: state.selectedTypes,
      });

      // Start scan
      startScan(proxies.length);

      // Perform scan
      const results = await scanProxies(
        proxies,
        {
          timeout: timeoutSeconds * 1000,
          testUrl,
          threadCount,
          types: state.selectedTypes,
        },
        (result) => {
          addResult(result);
          updateProgress(state.progress.completed + 1);
        }
      );

      completeScan();
      
      // Navigate to results
      router.push('/(tabs)/results');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Scan failed';
      setError(errorMessage);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [
    state.proxyInput,
    state.selectedTypes,
    state.progress.completed,
    timeoutSeconds,
    threadCount,
    testUrl,
    setError,
    setScanOptions,
    startScan,
    addResult,
    updateProgress,
    completeScan,
  ]);

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Proxy Scanner</Text>
            <Text className="text-sm text-muted">Test HTTP, HTTPS, SOCKS4 & SOCKS5 proxies</Text>
          </View>

          {/* Error Message */}
          {state.error && (
            <View className="bg-error/10 border border-error rounded-lg p-3">
              <Text className="text-sm text-error">{state.error}</Text>
            </View>
          )}

          {/* Proxy Input */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Proxy List</Text>
            <TextInput
              value={state.proxyInput}
              onChangeText={handleProxyInputChange}
              placeholder="Enter proxies (one per line)&#10;Format: ip:port or http://ip:port"
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={6}
              className="bg-surface border border-border rounded-lg p-3 text-foreground"
              style={{
                color: colors.foreground,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              }}
              editable={!state.isScanning}
            />
            <Text className="text-xs text-muted">
              {state.proxyInput.split('\n').filter(l => l.trim()).length} proxy(ies) entered
            </Text>
          </View>

          {/* Proxy Type Selector */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Proxy Types</Text>
            <View className="flex-row flex-wrap gap-2">
              {PROXY_TYPES.map(type => (
                <TouchableOpacity
                  key={type}
                  onPress={() => toggleProxyType(type)}
                  style={{
                    backgroundColor: state.selectedTypes.includes(type)
                      ? colors.primary
                      : colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                  }}
                  className="px-4 py-2 rounded-full"
                  disabled={state.isScanning}
                >
                  <Text
                    className={`text-sm font-medium ${
                      state.selectedTypes.includes(type) ? 'text-background' : 'text-foreground'
                    }`}
                  >
                    {type.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Scan Settings */}
          <View className="gap-4">
            <View className="gap-2">
              <View className="flex-row justify-between items-center">
                <Text className="text-sm font-semibold text-foreground">Timeout</Text>
                <Text className="text-sm text-primary font-medium">{timeoutSeconds}s</Text>
              </View>
              <View className="flex-row gap-2">
                {[5, 10, 15, 20, 30].map(sec => (
                  <TouchableOpacity
                    key={sec}
                    onPress={() => setTimeoutSeconds(sec)}
                    style={{
                      backgroundColor: timeoutSeconds === sec ? colors.primary : colors.surface,
                      borderColor: colors.border,
                      borderWidth: 1,
                    }}
                    className="flex-1 py-2 rounded-lg items-center"
                    disabled={state.isScanning}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        timeoutSeconds === sec ? 'text-background' : 'text-foreground'
                      }`}
                    >
                      {sec}s
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="gap-2">
              <View className="flex-row justify-between items-center">
                <Text className="text-sm font-semibold text-foreground">Threads</Text>
                <Text className="text-sm text-primary font-medium">{threadCount}</Text>
              </View>
              <View className="flex-row gap-2">
                {[1, 3, 5, 10].map(count => (
                  <TouchableOpacity
                    key={count}
                    onPress={() => setThreadCount(count)}
                    style={{
                      backgroundColor: threadCount === count ? colors.primary : colors.surface,
                      borderColor: colors.border,
                      borderWidth: 1,
                    }}
                    className="flex-1 py-2 rounded-lg items-center"
                    disabled={state.isScanning}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        threadCount === count ? 'text-background' : 'text-foreground'
                      }`}
                    >
                      {count}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Test URL</Text>
              <TextInput
                value={testUrl}
                onChangeText={setTestUrl}
                placeholder="http://httpbin.org/ip"
                placeholderTextColor={colors.muted}
                className="bg-surface border border-border rounded-lg p-3 text-foreground"
                style={{
                  color: colors.foreground,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                }}
                editable={!state.isScanning}
              />
            </View>
          </View>

          {/* Live Results Preview */}
          {state.results.length > 0 && (
            <View className="gap-2">
              <View className="flex-row justify-between items-center">
                <Text className="text-sm font-semibold text-foreground">Live Results</Text>
                <Text className="text-xs text-muted">
                  {state.progress.completed}/{state.progress.total}
                </Text>
              </View>
              <FlatList
                data={state.results.slice(-5)}
                keyExtractor={(item, idx) => `${item.ip}:${item.port}-${idx}`}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View
                    className="bg-surface border border-border rounded-lg p-2 mb-2 flex-row items-center justify-between"
                    style={{ borderColor: colors.border }}
                  >
                    <View className="flex-1">
                      <Text className="text-xs font-medium text-foreground">
                        {item.ip}:{item.port}
                      </Text>
                      <Text className="text-xs text-muted">{item.type.toUpperCase()}</Text>
                    </View>
                    <View className="items-end">
                      <View
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            item.status === 'working'
                              ? colors.success
                              : item.status === 'slow'
                              ? colors.warning
                              : colors.error,
                        }}
                      />
                      <Text className="text-xs text-muted mt-1">{item.responseTime}ms</Text>
                    </View>
                  </View>
                )}
              />
            </View>
          )}

          {/* Start Scan Button */}
          <TouchableOpacity
            onPress={handleStartScan}
            disabled={state.isScanning || !state.proxyInput.trim()}
            style={{
              backgroundColor: state.isScanning || !state.proxyInput.trim() ? colors.border : colors.primary,
              opacity: state.isScanning || !state.proxyInput.trim() ? 0.5 : 1,
            }}
            className="py-4 rounded-lg items-center justify-center flex-row gap-2"
          >
            {state.isScanning && <ActivityIndicator color={colors.background} size="small" />}
            <Text className="text-base font-semibold text-background">
              {state.isScanning ? `Scanning... ${state.progress.completed}/${state.progress.total}` : 'Start Scan'}
            </Text>
          </TouchableOpacity>

          {/* Progress Bar */}
          {state.isScanning && state.progress.total > 0 && (
            <View className="gap-2">
              <View
                className="h-2 bg-border rounded-full overflow-hidden"
                style={{ backgroundColor: colors.border }}
              >
                <View
                  className="h-full bg-primary rounded-full"
                  style={{
                    width: `${(state.progress.completed / state.progress.total) * 100}%`,
                    backgroundColor: colors.primary,
                  }}
                />
              </View>
              <Text className="text-xs text-muted text-center">
                {Math.round((state.progress.completed / state.progress.total) * 100)}% complete
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
