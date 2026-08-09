import crypto from 'node:crypto';
import { generateSyllabus, pickBestVideo } from './llm/syllabus.js';
import { searchAndDetail } from './youtube.js';

export async function generateCourse({
  providerName,
  providerConfig,
  youtubeApiKey,
  topic,
  level,
  language,
  videoCountRange,
  notes,
  onProgress = () => {},
}) {
  onProgress({ stage: 'syllabus', message: 'Designing the syllabus…' });
  const subtopics = await generateSyllabus({
    providerName,
    providerConfig,
    topic,
    level,
    language,
    videoCountRange,
    notes,
  });

  const syllabus = [];
  for (const sub of subtopics) {
    onProgress({
      stage: 'video-search',
      message: `Finding the best video for "${sub.subTopicTitle}"…`,
      order: sub.order,
      total: subtopics.length,
    });

    const candidates = await searchAndDetail({
      apiKey: youtubeApiKey,
      query: sub.searchQuery,
      language,
    });

    if (candidates.length === 0) {
      syllabus.push({
        order: sub.order,
        subTopicTitle: sub.subTopicTitle,
        video: null,
        userNotes: '',
        completed: false,
      });
      continue;
    }

    const { index, rationale } = await pickBestVideo({
      providerName,
      providerConfig,
      subTopicTitle: sub.subTopicTitle,
      level,
      candidates,
    });

    const chosen = candidates[index];
    syllabus.push({
      order: sub.order,
      subTopicTitle: sub.subTopicTitle,
      video: { ...chosen, selectionRationale: rationale },
      userNotes: '',
      completed: false,
    });
  }

  onProgress({ stage: 'done', message: 'Course ready.' });

  return {
    id: crypto.randomUUID(),
    topic,
    level,
    language,
    videoCountRange,
    notes: notes || '',
    createdAt: new Date().toISOString(),
    syllabus,
  };
}
