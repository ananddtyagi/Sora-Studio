export type SoraModel = 'sora-2' | 'sora-2-pro';

export interface VideoSizeOption {
  value: string;
  label: string;
  models: SoraModel[];
}

export const VIDEO_SIZE_OPTIONS: VideoSizeOption[] = [
  { value: '1280x720', label: '1280x720 (HD Landscape)', models: ['sora-2', 'sora-2-pro'] },
  { value: '720x1280', label: '720x1280 (HD Portrait)', models: ['sora-2', 'sora-2-pro'] },
  { value: '1792x1024', label: '1792x1024 (Wide Landscape)', models: ['sora-2-pro'] },
  { value: '1024x1792', label: '1024x1792 (Tall Portrait)', models: ['sora-2-pro'] },
];

export function getSizeOptionsForModel(model: SoraModel): VideoSizeOption[] {
  return VIDEO_SIZE_OPTIONS.filter((option) => option.models.includes(model));
}

export function getSizeOptionByValue(value: string): VideoSizeOption | undefined {
  return VIDEO_SIZE_OPTIONS.find((option) => option.value === value);
}
