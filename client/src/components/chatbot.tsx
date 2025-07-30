import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, FileText, Zap, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface ChatbotProps {
  className?: string;
}

const FAQ_RESPONSES = {
  // App functionality
  "what does this app do": "This is the Nutrient BOL Processor - an AI-powered document processing application that extracts structured data from Bill of Lading (BOL) documents. It automatically classifies documents, extracts key shipment information like carrier details, shipper/consignee addresses, item descriptions, and weights.",
  
  "how does it work": "Simply drag and drop your BOL documents (PDF format) into the upload zone. The app uses Nutrient's XTractFlow AI to automatically process the documents, extract key data fields, and organize them into different tabs based on their processing status.",
  
  "what can i do": "You can upload BOL documents, track processing progress, review extracted data, validate questionable results, retry failed documents, and export processed data in multiple formats (JSON, CSV, Excel, XML) for integration with your ERP/WMS/TMS systems.",

  // Supported formats
  "what formats": "The app supports PDF documents containing Bill of Lading information. It can handle both single BOL documents and multi-BOL PDFs with multiple bills of lading in one file.",
  
  "file types": "Currently, the app supports PDF files containing Bill of Lading documents. The AI can detect and process both single BOLs and documents containing multiple BOLs.",
  
  "export formats": "You can export processed data in four formats: JSON (structured data), CSV (spreadsheet-compatible), Excel (.xlsx files), and XML (for system integration). All exports include extracted BOL data, issuer information, and confidence scores.",

  // XTractFlow integration
  "what is xtractflow": "XTractFlow is Nutrient's advanced AI document processing engine that uses machine learning and natural language processing to extract structured data from documents. It's specifically trained to understand Bill of Lading formats and can identify key fields with high accuracy.",
  
  "how accurate": "XTractFlow provides confidence scores for each extraction, typically achieving 85-95% accuracy on well-formatted BOL documents. Documents with lower confidence scores are flagged for manual validation to ensure data quality.",
  
  "xtractflow": "XTractFlow integration allows this app to process BOL documents with enterprise-grade accuracy. It uses OpenAI's language models combined with Nutrient's document understanding to extract carrier information, shipment details, item descriptions, weights, and addresses automatically.",
  
  "ai processing": "The AI processing happens through XTractFlow, which analyzes document structure, identifies BOL-specific fields, and extracts data using advanced OCR and natural language understanding. The system can handle various BOL formats and layouts automatically.",

  // Multi-BOL features
  "multi bol": "The app can process PDF files containing multiple Bill of Lading documents. It automatically detects how many BOLs are in each file, extracts data from each one separately, and provides summary information showing total BOLs, combined weights, and all BOL numbers.",
  
  "multiple bols": "Yes! Multi-BOL documents are fully supported. The app will show you a summary with the total number of BOLs found, file size, and combined data. Each individual BOL is processed separately with its own confidence score and can be exported individually or in bulk.",

  // Technical details
  "api integration": "The app provides clean JSON exports that are ready for ERP/WMS/TMS integration. Each export includes document metadata, BOL issuer information, line item details with proper sequencing, and validation status flags.",
  
  "data quality": "All extracted data includes confidence scores and validation flags. Documents requiring manual review are clearly marked, and you can validate questionable extractions before exporting to ensure data quality for downstream systems.",
  
  "bol issuer": "The app automatically extracts BOL issuer information from document titles in the format '[Company Name] - Bill of Lading'. This issuer data is included in all export formats to help identify the source organization of each BOL.",

  // Troubleshooting
  "not working": "If processing isn't working, check that: 1) Your file is a PDF containing BOL information, 2) The XTractFlow service is connected (check the status indicator in the header), 3) Try uploading a different BOL document to test. You can also retry failed documents from the Unprocessed tab.",
  
  "failed processing": "Documents can fail processing if they're not recognized as BOLs, have poor image quality, or contain unsupported formats. Failed documents appear in the Unprocessed tab where you can retry processing or delete them.",
  
  "help": "Common tasks: Upload PDFs by dragging to the upload zone, monitor progress in the Processing tab, review results in the Processed tab, validate uncertain extractions in the Validation tab, retry failures in the Unprocessed tab, and export data using the bulk export buttons."
};

const SUGGESTED_QUESTIONS = [
  "What does this app do?",
  "What file formats are supported?",
  "How does XTractFlow work?",
  "Can it handle multiple BOLs?",
  "What export formats are available?",
  "How accurate is the AI processing?"
];

export default function Chatbot({ className = "" }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Hi! I'm here to help you with the Nutrient BOL Processor. Ask me about app features, supported formats, XTractFlow integration, or anything else!",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const findBestResponse = (question: string): string => {
    const normalizedQuestion = question.toLowerCase().trim();
    
    // Direct matches
    for (const [key, response] of Object.entries(FAQ_RESPONSES)) {
      if (normalizedQuestion.includes(key)) {
        return response;
      }
    }

    // Keyword matching
    if (normalizedQuestion.includes("export") || normalizedQuestion.includes("download")) {
      return FAQ_RESPONSES["export formats"];
    }
    if (normalizedQuestion.includes("upload") || normalizedQuestion.includes("file")) {
      return FAQ_RESPONSES["what formats"];
    }
    if (normalizedQuestion.includes("accurate") || normalizedQuestion.includes("confidence")) {
      return FAQ_RESPONSES["how accurate"];
    }
    if (normalizedQuestion.includes("multi") || normalizedQuestion.includes("multiple")) {
      return FAQ_RESPONSES["multi bol"];
    }
    if (normalizedQuestion.includes("error") || normalizedQuestion.includes("fail")) {
      return FAQ_RESPONSES["failed processing"];
    }

    return "I'm not sure about that specific question. Try asking about: app functionality, supported file formats, XTractFlow integration, multi-BOL processing, export options, or data accuracy. You can also try the suggested questions below!";
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isBot: false,
      timestamp: new Date()
    };

    const botResponse: Message = {
      id: (Date.now() + 1).toString(),
      text: findBestResponse(inputValue),
      isBot: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage, botResponse]);
    setInputValue("");
  };

  const handleSuggestedQuestion = (question: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text: question,
      isBot: false,
      timestamp: new Date()
    };

    const botResponse: Message = {
      id: (Date.now() + 1).toString(),
      text: findBestResponse(question),
      isBot: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage, botResponse]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-nutrient-primary hover:bg-nutrient-secondary shadow-lg"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </Button>
      )}

      {isOpen && (
        <Card className="w-96 h-[500px] bg-nutrient-card border-slate-700 shadow-xl flex flex-col">
          <CardHeader className="bg-nutrient-primary text-white rounded-t-lg p-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bot className="h-5 w-5" />
                <CardTitle className="text-lg">BOL Assistant</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.isBot
                        ? 'bg-slate-700 text-nutrient-text'
                        : 'bg-nutrient-primary text-white'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.isBot && <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                      {!message.isBot && <User className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                      <p className="text-sm">{message.text}</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Suggested Questions */}
              {messages.length <= 2 && (
                <div className="space-y-2">
                  <p className="text-xs text-nutrient-text-secondary">Suggested questions:</p>
                  <div className="flex flex-wrap gap-1">
                    {SUGGESTED_QUESTIONS.map((question, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="cursor-pointer hover:bg-nutrient-secondary hover:text-white border-slate-600 text-xs"
                        onClick={() => handleSuggestedQuestion(question)}
                      >
                        {question}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-slate-700 p-4 flex-shrink-0">
              <div className="flex space-x-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about BOL processing..."
                  className="flex-1 bg-slate-700 border-slate-600 text-nutrient-text placeholder-nutrient-text-secondary"
                />
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className="bg-nutrient-primary hover:bg-nutrient-secondary"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}