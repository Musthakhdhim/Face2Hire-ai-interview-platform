import axiosClient from './axiosClient';

export const audioService = {
  uploadAudio: async (blob: Blob): Promise<string> => {
    const { presignedUrl, fileKey } = await axiosClient.post('/audio/upload-url', {
      fileName: `interview-${Date.now()}.webm`,
      fileType: 'audio/webm',
    }).then(res => res.data.data);
    await fetch(presignedUrl, { method: 'PUT', body: blob });
    const { audioUrl } = await axiosClient.post('/audio/confirm', { fileKey }).then(res => res.data.data);
    return audioUrl;
  },
  textToSpeech: async (text: string, avatarStyle: string): Promise<Blob> => {
    const response = await axiosClient.post('/audio/tts', { text, voice: avatarStyle }, { responseType: 'blob' });
    return response.data;
  },
};