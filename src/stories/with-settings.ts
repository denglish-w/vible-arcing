import {
  DEFAULT_SETTINGS,
  mergeSettings,
  useSettingsStore,
  type DisplaySettings,
} from "@/lib/settings";

/**
 * Resets the display settings store to the defaults plus `parameters.settings`
 * before each story, and restores it afterwards.
 */
export function resetSettings({
  parameters,
}: {
  parameters: { settings?: Partial<DisplaySettings> };
}) {
  const previous = useSettingsStore.getState().settings;
  useSettingsStore.setState({
    settings: mergeSettings({
      ...DEFAULT_SETTINGS,
      ...parameters.settings,
    }),
  });
  return () => useSettingsStore.setState({ settings: previous });
}
