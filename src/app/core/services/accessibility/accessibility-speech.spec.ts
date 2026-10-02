import { TestBed } from '@angular/core/testing';

import { provideTestTransloco } from '../../../testing/transloco.testing';
import { AccessibilityService } from './accessibility.service';

class MockUtterance {
  public lang = '';
  public voice: SpeechSynthesisVoice | null = null;

  constructor(public text: string) {}
}

function createVoice(lang: string): SpeechSynthesisVoice {
  return { lang, name: lang, voiceURI: lang, default: false, localService: true };
}

describe('AccessibilityService: язык первого речевого запроса', () => {
  let originalLang: string;
  const speak = vi.fn<(utterance: SpeechSynthesisUtterance) => void>();
  const getVoices = vi.fn<() => SpeechSynthesisVoice[]>();

  beforeEach(() => {
    originalLang = document.documentElement.lang;
    speak.mockReset();
    getVoices.mockReset().mockReturnValue([]);
    vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance);
    vi.stubGlobal('speechSynthesis', { speak, getVoices, cancel: vi.fn() });
    TestBed.configureTestingModule({ providers: provideTestTransloco() });
  });

  afterEach(() => {
    document.documentElement.lang = originalLang;
    vi.unstubAllGlobals();
  });

  it.each(['ru', 'en', 'de-DE', 'pt-BR', 'ja'])(
    'передаёт язык %s при первом вызове с ещё пустым списком голосов',
    (language) => {
      document.documentElement.lang = language;
      const service = TestBed.inject(AccessibilityService);
      service.setSoundEnabled(true);

      service.speak('Текст');

      expect(speak).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ text: 'Текст', lang: language, voice: null }),
      );
    },
  );

  it('предпочитает точное совпадение регионального варианта', () => {
    document.documentElement.lang = 'pt-BR';
    const otherRegion = createVoice('pt-PT');
    const selected = createVoice('pt-BR');
    getVoices.mockReturnValue([otherRegion, selected]);
    const service = TestBed.inject(AccessibilityService);
    service.setSoundEnabled(true);

    service.speak('Текст');

    expect(speak).toHaveBeenCalledWith(expect.objectContaining({ lang: 'pt-BR', voice: selected }));
  });

  it('сохраняет язык запроса, если доступен только голос другого языка', () => {
    document.documentElement.lang = 'ja';
    getVoices.mockReturnValue([createVoice('en-US')]);
    const service = TestBed.inject(AccessibilityService);
    service.setSoundEnabled(true);

    service.speak('Текст');

    expect(speak).toHaveBeenCalledWith(expect.objectContaining({ lang: 'ja', voice: null }));
  });

  it('использует появившийся голос при следующем вызове без изменения языка', () => {
    document.documentElement.lang = 'ru';
    const selected = createVoice('ru-RU');
    getVoices.mockReturnValueOnce([]).mockReturnValue([selected]);
    const service = TestBed.inject(AccessibilityService);
    service.setSoundEnabled(true);

    service.speak('Первый');
    service.speak('Второй');

    expect(speak).toHaveBeenNthCalledWith(1, expect.objectContaining({ lang: 'ru', voice: null }));
    expect(speak).toHaveBeenNthCalledWith(2, expect.objectContaining({ lang: 'ru', voice: selected }));
  });

  it('использует язык браузера, если язык документа не задан', () => {
    document.documentElement.lang = '';
    const service = TestBed.inject(AccessibilityService);
    service.setSoundEnabled(true);

    service.speak('Текст');

    expect(speak).toHaveBeenCalledWith(expect.objectContaining({ lang: navigator.language }));
  });
});
