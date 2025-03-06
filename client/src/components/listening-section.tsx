import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, SkipBack, SkipForward, Volume2, Plus, Save } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Question {
  text: string;
  options: string[];
  correctAnswer?: number;
}

export function ListeningSection() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [transcription, setTranscription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState<Question>({
    text: "",
    options: ["", "", "", ""],
    correctAnswer: undefined
  });
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(true);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current?.duration || 0);
        setError(null);
      });

      audioRef.current.addEventListener('timeupdate', () => {
        const progress = (audioRef.current?.currentTime || 0) / (audioRef.current?.duration || 1) * 100;
        setProgress(progress);
      });

      audioRef.current.addEventListener('error', () => {
        setError("Unable to load audio. Please try again later.");
        setIsPlaying(false);
      });

      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        setProgress(0);
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
        }
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('loadedmetadata', () => {});
        audioRef.current.removeEventListener('timeupdate', () => {});
        audioRef.current.removeEventListener('error', () => {});
        audioRef.current.removeEventListener('ended', () => {});
      }
    };
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setError(null);
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Audio playback failed:", error);
            setError("Audio playback failed. Please try again.");
          });
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
    }
  };

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        audioRef.current.duration,
        audioRef.current.currentTime + 10
      );
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleAddQuestion = () => {
    if (newQuestion.text && newQuestion.options.every(opt => opt.trim() !== "") && newQuestion.correctAnswer !== undefined) {
      setQuestions([...questions, newQuestion]);
      setNewQuestion({
        text: "",
        options: ["", "", "", ""],
        correctAnswer: undefined
      });
    } else {
      setError("Please fill in all question fields and select a correct answer");
    }
  };

  const handleSaveLesson = async () => {
    try {
      // Validate required fields
      if (!title || !transcription || questions.length === 0) {
        setError("Please fill in all required fields (title, transcription, and questions)");
        return;
      }

      // Create lesson data object
      const lessonData = {
        title,
        transcription,
        questions: JSON.stringify(questions), // Explicitly stringify questions array
        audioUrl: audioUrl
      };

      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(lessonData)
      });

      if (!response.ok) {
        throw new Error('Failed to save lesson');
      }

      setError(null);
      setIsEditing(false);
      // Reset user answers when switching to quiz mode
      setUserAnswers([]);
      setShowResults(false);
    } catch (err) {
      console.error('Save lesson error:', err);
      setError('Failed to save lesson. Please try again.');
    }
  };

  const handleSelectAnswer = (questionIndex: number, optionIndex: number) => {
    if (!showResults) {
      const newAnswers = [...userAnswers];
      newAnswers[questionIndex] = optionIndex;
      setUserAnswers(newAnswers);
    }
  };

  const handleSubmitAnswers = () => {
    setShowResults(true);
  };

  const renderQuestionOptions = (question: Question, questionIndex: number) => {
    return question.options.map((option, optionIndex) => (
      <Button
        key={optionIndex}
        variant={
          showResults
            ? question.correctAnswer === optionIndex
              ? "default"
              : userAnswers[questionIndex] === optionIndex
              ? "destructive"
              : "outline"
            : userAnswers[questionIndex] === optionIndex
            ? "default"
            : "outline"
        }
        className={`justify-start h-auto py-4 px-6 ${
          showResults && question.correctAnswer === optionIndex ? "bg-green-500" : ""
        }`}
        onClick={() => !isEditing && handleSelectAnswer(questionIndex, optionIndex)}
        disabled={showResults}
      >
        <span className="text-left">
          {String.fromCharCode(65 + optionIndex)}. {option}
        </span>
      </Button>
    ));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">
          {isEditing ? "Create Listening Practice" : "Take Listening Practice"}
        </h2>
        {isEditing ? (
          <Button onClick={handleSaveLesson}>
            <Save className="w-4 h-4 mr-2" />
            Save Lesson
          </Button>
        ) : (
          <Button onClick={() => setIsEditing(true)} variant="outline">
            Edit Lesson
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>Lesson Title</CardTitle>
          </CardHeader>
          <CardContent>
            <Input 
              placeholder="Enter lesson title" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </CardContent>
        </Card>
      ) : (
        <h1 className="text-2xl font-bold">{title}</h1>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Audio</CardTitle>
          {isEditing && (
            <CardDescription>Upload an audio file for this lesson</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {isEditing && (
            <Input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="mb-4"
            />
          )}

          {audioUrl && (
            <>
              <audio
                ref={audioRef}
                src={audioUrl}
                onCanPlay={() => setError(null)}
              />

              <div className="space-y-2 mb-6">
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{formatTime((progress / 100) * duration)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={skipBackward}
                  className="hover:bg-muted"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button 
                  variant="default"
                  size="icon"
                  className="h-14 w-14 rounded-full shadow-lg hover:scale-105 transition-transform"
                  onClick={togglePlayPause}
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6 ml-1" />
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={skipForward}
                  className="hover:bg-muted"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>Transcription</CardTitle>
            <CardDescription>Enter the lecture transcription</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea 
              placeholder="Enter the lecture transcription here..."
              value={transcription}
              onChange={(e) => setTranscription(e.target.value)}
              className="min-h-[200px]"
            />
          </CardContent>
        </Card>
      ) : (
        transcription && (
          <Card>
            <CardHeader>
              <CardTitle>Transcript</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert">
                <p>{transcription}</p>
              </div>
            </CardContent>
          </Card>
        )
      )}

      <Card>
        <CardHeader>
          <CardTitle>Questions</CardTitle>
          {isEditing && (
            <CardDescription>Add comprehension questions</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.map((q, questionIndex) => (
            <div key={questionIndex} className="border rounded-lg p-4 space-y-2">
              <p className="font-medium">{questionIndex + 1}. {q.text}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-6">
                {isEditing ? (
                  q.options.map((option, optionIndex) => (
                    <Button
                      key={optionIndex}
                      variant={q.correctAnswer === optionIndex ? "default" : "outline"}
                      className="justify-start h-auto py-4 px-6"
                      onClick={() => {
                        setQuestions(questions.map((question, idx) => 
                          idx === questionIndex ? 
                            {...question, correctAnswer: optionIndex} : 
                            question
                        ));
                      }}
                    >
                      <span className="text-left">
                        {String.fromCharCode(65 + optionIndex)}. {option}
                      </span>
                    </Button>
                  ))
                ) : (
                  renderQuestionOptions(q, questionIndex)
                )}
              </div>
            </div>
          ))}

          {isEditing && (
            <div className="border rounded-lg p-4 space-y-4">
              <Input
                placeholder="Enter question text"
                value={newQuestion.text}
                onChange={(e) => setNewQuestion({...newQuestion, text: e.target.value})}
              />
              <div className="space-y-2">
                {newQuestion.options.map((option, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Button
                      variant={newQuestion.correctAnswer === index ? "default" : "outline"}
                      className="w-8 h-8 p-0"
                      onClick={() => setNewQuestion({...newQuestion, correctAnswer: index})}
                    >
                      {String.fromCharCode(65 + index)}
                    </Button>
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...newQuestion.options];
                        newOptions[index] = e.target.value;
                        setNewQuestion({...newQuestion, options: newOptions});
                      }}
                    />
                  </div>
                ))}
              </div>
              <Button onClick={handleAddQuestion}>
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </div>
          )}

          {!isEditing && questions.length > 0 && !showResults && (
            <Button 
              className="w-full md:w-auto"
              onClick={handleSubmitAnswers}
              disabled={userAnswers.length !== questions.length}
            >
              Submit Answers
            </Button>
          )}

          {showResults && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Results</h3>
              <p>
                Score: {userAnswers.filter((answer, index) => answer === questions[index].correctAnswer).length} 
                out of {questions.length}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}