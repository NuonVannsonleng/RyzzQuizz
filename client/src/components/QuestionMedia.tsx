/**
 * Big media block shown above a question — mirrors the photo panel on a real
 * Kahoot slide. `image` is either an https:// URL (real photo — country flags
 * use flagcdn.com, see build.ts) or a short string like an emoji, rendered
 * huge inside a framed card for questions that only need a themed icon.
 */
export function QuestionMedia({ image, size = 'md' }: { image: string; size?: 'md' | 'lg' }) {
  const isUrl = image.startsWith('http');

  if (isUrl) {
    return (
      <div className={`qmedia qmedia--${size}`}>
        <img src={image} alt="" loading="lazy" />
      </div>
    );
  }

  return (
    <div className={`qmedia qmedia--${size} qmedia--glyph`} aria-hidden="true">
      <span>{image}</span>
    </div>
  );
}
