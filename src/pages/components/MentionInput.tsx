import {
  useCallback,
  useState,
  useRef,
  useMemo,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from "react";
import {
  EditorState,
  convertFromRaw,
  ContentState,
  convertToRaw,
} from "draft-js";
import Editor from "@draft-js-plugins/editor";
import createMentionPlugin, {
  type MentionData,
} from "@draft-js-plugins/mention";
import { userService } from "../../services/api";

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  autoFocus?: boolean;
  onKeyDown?: (event: React.KeyboardEvent) => void;
}

export interface MentionInputRef {
  clear: () => void;
  focus: () => void;
  getFormattedValue: () => string;
}

const MentionInput = forwardRef<MentionInputRef, MentionInputProps>(
  (
    {
      value,
      onChange,
      placeholder = "What's on your mind?",
      className = "",
      disabled = false,
      onFocus,
      onBlur,
      onKeyDown,
    },
    forwardedRef
  ) => {
    const editorRef = useRef<Editor>(null);
    const [editorState, setEditorState] = useState(() => {
      if (value) {
        try {
          // Try to parse as Draft.js JSON format first
          const contentState = convertFromRaw(JSON.parse(value));
          return EditorState.createWithContent(contentState);
        } catch {
          // If it fails, treat it as plain text
          const contentState = ContentState.createFromText(value);
          return EditorState.createWithContent(contentState);
        }
      }
      return EditorState.createEmpty();
    });

    // Helper function to convert editor state to formatted text with mentions
    const getFormattedText = useCallback((state: EditorState) => {
      const contentState = state.getCurrentContent();
      const rawContent = convertToRaw(contentState);
      let text = contentState.getPlainText();

      // Process mentions to format as @[username](username)
      const blocks = rawContent.blocks;
      const entityMap = rawContent.entityMap;

      // Build formatted text with mentions
      let formattedText = "";
      blocks.forEach((block) => {
        let blockText = block.text;
        const entityRanges = block.entityRanges;

        // Sort entity ranges by offset in reverse order to avoid offset issues
        const sortedRanges = [...entityRanges].sort(
          (a, b) => b.offset - a.offset
        );

        sortedRanges.forEach((range) => {
          const entity = entityMap[range.key];
          if (entity && entity.type === "mention") {
            const username = entity.data.mention.name;
            const formattedMention = `@[${username}](${username})`;

            blockText =
              blockText.substring(0, range.offset) +
              formattedMention +
              blockText.substring(range.offset + range.length);
          }
        });

        formattedText += blockText;
      });

      return formattedText || text;
    }, []);

    // Expose methods through ref
    useImperativeHandle(
      forwardedRef,
      () => ({
        clear: () => {
          const emptyState = EditorState.createEmpty();
          setEditorState(emptyState);
          onChange("");
        },
        focus: () => {
          if (editorRef.current) {
            editorRef.current.focus();
          }
        },
        getFormattedValue: () => {
          return getFormattedText(editorState);
        },
      }),
      [onChange, getFormattedText, editorState]
    );

    // Sync editor state when value prop changes from outside
    useEffect(() => {
      const currentText = editorState.getCurrentContent().getPlainText();
      if (value !== currentText) {
        if (value === "") {
          // If value is cleared externally, create empty editor state
          setEditorState(EditorState.createEmpty());
        } else {
          // If value is set externally, update editor state
          try {
            const contentState = convertFromRaw(JSON.parse(value));
            setEditorState(EditorState.createWithContent(contentState));
          } catch {
            const contentState = ContentState.createFromText(value);
            setEditorState(EditorState.createWithContent(contentState));
          }
        }
      }
    }, [value, editorState]);

    const [open, setOpen] = useState(false);
    const [suggestions, setSuggestions] = useState<MentionData[]>([]);

    const { MentionSuggestions, plugins } = useMemo(() => {
      const mentionPlugin = createMentionPlugin({
        mentionPrefix: "@",
        supportWhitespace: false,
        mentionComponent: ({ children }) => (
          <span
            style={{
              color: "#1d4ed8",
              backgroundColor: "rgba(29, 78, 216, 0.1)",
              padding: "2px 6px",
              borderRadius: "12px",
              fontWeight: "600",
              fontSize: "14px",
              border: "1px solid rgba(29, 78, 216, 0.2)",
            }}
          >
            {children}
          </span>
        ),
      });
      const { MentionSuggestions } = mentionPlugin;
      const plugins = [mentionPlugin];
      return { plugins, MentionSuggestions };
    }, []);

    const onOpenChange = useCallback((_open: boolean) => {
      setOpen(_open);
    }, []);

    const onSearchChange = useCallback(
      async ({ value: searchValue }: { value: string }) => {
        if (!searchValue) {
          setSuggestions([]);
          return;
        }

        try {
          const searchResults = await userService.searchUsers(searchValue);
          const mentionUsers = searchResults.map((user: any) => ({
            name: user.username,
            fullName: user.name,
          }));
          const filteredSuggestions = mentionUsers.filter((user: MentionData) =>
            user.name.toLowerCase().includes(searchValue.toLowerCase())
          );
          setSuggestions(filteredSuggestions);
        } catch (error) {
          console.error("Failed to search users:", error);
          setSuggestions([]);
        }
      },
      []
    );

    const onEditorStateChange = useCallback(
      (newEditorState: EditorState) => {
        setEditorState(newEditorState);
        // For real-time onChange, just pass the plain text
        // The formatted text with mentions will be available via getFormattedValue()
        const plainText = newEditorState.getCurrentContent().getPlainText();
        onChange(plainText);
      },
      [onChange]
    );

    const handleKeyCommand = useCallback(
      (command: string) => {
        if (onKeyDown && command === "split-block") {
          // Handle Enter key
          const event = new KeyboardEvent("keydown", { key: "Enter" }) as any;
          onKeyDown(event);
          return "handled";
        }
        return "not-handled";
      },
      [onKeyDown]
    );

    return (
      <div className={`relative ${className}`}>
        <div className="w-full min-h-[44px] px-4 py-3 border border-gray-200 rounded-full bg-gray-50 text-black focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 focus-within:bg-white transition-all duration-200 hover:bg-gray-100 focus-within:hover:bg-white">
          <Editor
            ref={editorRef}
            editorState={editorState}
            onChange={onEditorStateChange}
            plugins={plugins}
            placeholder={placeholder}
            readOnly={disabled}
            onFocus={onFocus}
            onBlur={onBlur}
            handleKeyCommand={handleKeyCommand}
            spellCheck={false}
          />
          <MentionSuggestions
            open={open}
            onOpenChange={onOpenChange}
            suggestions={suggestions}
            onSearchChange={onSearchChange}
            entryComponent={({ mention, ...props }) => (
              <div
                {...props}
                className="flex items-center p-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors duration-150"
              >
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden mr-3 flex-shrink-0">
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 text-white text-sm font-semibold">
                    {mention.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-900">
                    {(mention as any).fullName || mention.name}
                  </span>
                  <span className="text-sm text-gray-500">@{mention.name}</span>
                </div>
              </div>
            )}
            popoverContainer={({ children }) => (
              <div className="absolute z-50 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-auto">
                {children}
              </div>
            )}
          />
        </div>
      </div>
    );
  }
);

MentionInput.displayName = "MentionInput";

export default MentionInput;
