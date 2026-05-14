/**
 * Renders a single bold-aware text string.
 * Handles **bold** markdown patterns inline.
 */
function renderInlineText(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const boldMatch = part.match(/^\*\*(.+)\*\*$/);
    if (boldMatch) {
      return <strong key={i}>{boldMatch[1]}</strong>;
    }
    return part;
  });
}

/**
 * Renders a single analysis section as a card.
 */
export default function SectionCard({ section }) {
  const { title, variant, number, content } = section;

  return (
    <div className={`section-card section-card--${variant}`}>
      <div className="section-card__header">
        <div className="section-card__indicator" />
        <span className="section-card__number">{number}</span>
        <h3 className="section-card__title">{title}</h3>
      </div>
      <div className="section-card__body">
        <div className="section-card__text">
          {content.map((block, i) => {
            if (block.type === "list") {
              return (
                <ul key={i}>
                  {block.items.map((item, j) => (
                    <li key={j}>{renderInlineText(item)}</li>
                  ))}
                </ul>
              );
            }
            return <p key={i}>{renderInlineText(block.content)}</p>;
          })}
        </div>
      </div>
    </div>
  );
}
