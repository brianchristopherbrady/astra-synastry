import ReactMarkdown, { type Components } from "react-markdown";

// The server emits only these elements; anything else (links, images, code, raw HTML) is unwrapped to text.
const ALLOWED_ELEMENTS = ["h2", "h3", "p", "ul", "ol", "li", "strong", "em", "blockquote", "hr"];

// Shift headings down one level because the drawer title is the surrounding h2.
const COMPONENTS: Components = {
  h2: ({ node: _node, ...props }) => <h3 {...props} />,
  h3: ({ node: _node, ...props }) => <h4 {...props} />,
};

export function AiMarkdown({ children }: { children: string }) {
  return (
    <div className="ai-markdown">
      <ReactMarkdown allowedElements={ALLOWED_ELEMENTS} unwrapDisallowed components={COMPONENTS}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
