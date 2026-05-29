import { ScrollView, Text, View, TouchableOpacity, FlatList, Share, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useProxyContext } from '@/lib/proxy-context';
import { useCallback, useState } from 'react';
import { useColors } from '@/hooks/use-colors';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { exportAsJSON, exportAsTXT, exportAsCSV, ProxyStatus } from '@/lib/proxy-scanner';

type FilterType = 'all' | 'working' | 'slow' | 'failed';
type SortType = 'speed' | 'type' | 'status';

export default function ResultsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { state, clearResults } = useProxyContext();
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('speed');

  const filteredResults = state.results.filter(result => {
    if (filter === 'all') return true;
    return result.status === filter;
  });

  const sortedResults = [...filteredResults].sort((a, b) => {
    if (sortBy === 'speed') return a.responseTime - b.responseTime;
    if (sortBy === 'type') return a.type.localeCompare(b.type);
    if (sortBy === 'status') {
      const statusOrder = { working: 0, slow: 1, failed: 2, pending: 3 };
      return statusOrder[a.status as ProxyStatus] - statusOrder[b.status as ProxyStatus];
    }
    return 0;
  });

  const workingProxies = state.results.filter(r => r.status === 'working');
  const slowProxies = state.results.filter(r => r.status === 'slow');
  const failedProxies = state.results.filter(r => r.status === 'failed');

  const handleCopyWorkingProxies = useCallback(async () => {
    if (workingProxies.length === 0) {
      Alert.alert('No working proxies', 'There are no working proxies to copy.');
      return;
    }

    const proxyList = workingProxies.map(p => `${p.ip}:${p.port}`).join('\n');
    await Clipboard.setStringAsync(proxyList);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied', `${workingProxies.length} working proxies copied to clipboard.`);
  }, [workingProxies]);

  const handleExport = useCallback(
    async (format: 'json' | 'txt' | 'csv') => {
      let content = '';
      let filename = '';

      if (format === 'json') {
        content = exportAsJSON(state.results);
        filename = 'proxies.json';
      } else if (format === 'txt') {
        content = exportAsTXT(state.results);
        filename = 'proxies.txt';
      } else {
        content = exportAsCSV(state.results);
        filename = 'proxies.csv';
      }

      try {
        await Share.share({
          message: content,
          title: filename,
          url: `data:text/${format === 'json' ? 'plain' : format};base64,${Buffer.from(content).toString('base64')}`,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        Alert.alert('Export failed', 'Could not export results.');
      }
    },
    [state.results]
  );

  const handleClearResults = useCallback(() => {
    Alert.alert('Clear Results', 'Are you sure you want to clear all results?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          clearResults();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        },
      },
    ]);
  }, [clearResults]);

  const getStatusColor = (status: ProxyStatus) => {
    if (status === 'working') return colors.success;
    if (status === 'slow') return colors.warning;
    return colors.error;
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-4">
          {/* Header */}
          <View className="flex-row justify-between items-center">
            <View className="gap-1">
              <Text className="text-2xl font-bold text-foreground">Results</Text>
              <Text className="text-sm text-muted">{state.results.length} proxies scanned</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-2"
            >
              <Text className="text-lg text-primary">✕</Text>
            </TouchableOpacity>
          </View>

          {/* Statistics */}
          <View className="flex-row gap-2">
            <View
              className="flex-1 bg-surface border border-border rounded-lg p-3 items-center"
              style={{ borderColor: colors.border }}
            >
              <Text className="text-2xl font-bold text-success">{workingProxies.length}</Text>
              <Text className="text-xs text-muted mt-1">Working</Text>
            </View>
            <View
              className="flex-1 bg-surface border border-border rounded-lg p-3 items-center"
              style={{ borderColor: colors.border }}
            >
              <Text className="text-2xl font-bold text-warning">{slowProxies.length}</Text>
              <Text className="text-xs text-muted mt-1">Slow</Text>
            </View>
            <View
              className="flex-1 bg-surface border border-border rounded-lg p-3 items-center"
              style={{ borderColor: colors.border }}
            >
              <Text className="text-2xl font-bold text-error">{failedProxies.length}</Text>
              <Text className="text-xs text-muted mt-1">Failed</Text>
            </View>
          </View>

          {/* Filter Tabs */}
          <View className="gap-2">
            <Text className="text-xs font-semibold text-muted uppercase">Filter</Text>
            <View className="flex-row gap-2">
              {(['all', 'working', 'slow', 'failed'] as FilterType[]).map(f => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFilter(f)}
                  style={{
                    backgroundColor: filter === f ? colors.primary : colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                  }}
                  className="px-3 py-2 rounded-full"
                >
                  <Text
                    className={`text-xs font-medium capitalize ${
                      filter === f ? 'text-background' : 'text-foreground'
                    }`}
                  >
                    {f}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sort Options */}
          <View className="gap-2">
            <Text className="text-xs font-semibold text-muted uppercase">Sort By</Text>
            <View className="flex-row gap-2">
              {(['speed', 'type', 'status'] as SortType[]).map(s => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSortBy(s)}
                  style={{
                    backgroundColor: sortBy === s ? colors.primary : colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                  }}
                  className="px-3 py-2 rounded-full"
                >
                  <Text
                    className={`text-xs font-medium capitalize ${
                      sortBy === s ? 'text-background' : 'text-foreground'
                    }`}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Results List */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">
              {sortedResults.length} Result{sortedResults.length !== 1 ? 's' : ''}
            </Text>
            <FlatList
              data={sortedResults}
              keyExtractor={(item, idx) => `${item.ip}:${item.port}-${idx}`}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View
                  className="bg-surface border border-border rounded-lg p-3 mb-2 flex-row items-center justify-between"
                  style={{ borderColor: colors.border }}
                >
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <View
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: getStatusColor(item.status) }}
                      />
                      <Text className="text-sm font-medium text-foreground">
                        {item.ip}:{item.port}
                      </Text>
                    </View>
                    <View className="flex-row gap-2 mt-1">
                      <Text className="text-xs text-muted bg-background px-2 py-1 rounded">
                        {item.type.toUpperCase()}
                      </Text>
                      <Text className="text-xs text-muted capitalize">{item.status}</Text>
                    </View>
                  </View>
                  <View className="items-end gap-1">
                    <Text className="text-sm font-semibold text-foreground">
                      {item.responseTime}ms
                    </Text>
                    {item.error && (
                      <Text className="text-xs text-error">{item.error.substring(0, 15)}</Text>
                    )}
                  </View>
                </View>
              )}
            />
          </View>

          {/* Action Buttons */}
          <View className="gap-2">
            <TouchableOpacity
              onPress={handleCopyWorkingProxies}
              style={{ backgroundColor: colors.primary }}
              className="py-3 rounded-lg items-center"
            >
              <Text className="text-base font-semibold text-background">
                Copy Working Proxies ({workingProxies.length})
              </Text>
            </TouchableOpacity>

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => handleExport('json')}
                style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
                className="flex-1 py-2 rounded-lg items-center"
              >
                <Text className="text-sm font-medium text-foreground">JSON</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleExport('txt')}
                style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
                className="flex-1 py-2 rounded-lg items-center"
              >
                <Text className="text-sm font-medium text-foreground">TXT</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleExport('csv')}
                style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
                className="flex-1 py-2 rounded-lg items-center"
              >
                <Text className="text-sm font-medium text-foreground">CSV</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleClearResults}
              style={{ backgroundColor: colors.error }}
              className="py-3 rounded-lg items-center"
            >
              <Text className="text-base font-semibold text-background">Clear Results</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
