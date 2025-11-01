import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ValidatedInput } from '@/components/ValidatedInput';
import { 
  sanitizeString, 
  validateEmail, 
  validateUrl, 
  sanitizeArray,
  validateNumber,
  validateJson,
  validateFileName
} from '@/lib/inputValidation';
import { AlertCircle, CheckCircle2, Play, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface TestCase {
  name: string;
  input: string | string[] | any;
  expectedValid: boolean;
  description: string;
}

export default function ValidationTesting() {
  const [activeTests, setActiveTests] = useState<Record<string, any>>({});
  const [testInputs, setTestInputs] = useState({
    string: '',
    email: '',
    url: '',
    array: '',
    number: '',
    json: '',
    filename: ''
  });

  const stringTests: TestCase[] = [
    { name: 'Normal Text', input: 'Hello World', expectedValid: true, description: 'Basic alphanumeric text' },
    { name: 'SQL Injection', input: "'; DROP TABLE users--", expectedValid: false, description: 'SQL injection attempt' },
    { name: 'XSS Attack', input: '<script>alert("XSS")</script>', expectedValid: false, description: 'Cross-site scripting' },
    { name: 'Path Traversal', input: '../../etc/passwd', expectedValid: false, description: 'Directory traversal' },
    { name: 'Null Bytes', input: 'test\x00data', expectedValid: false, description: 'Null byte injection' },
    { name: 'Long String', input: 'a'.repeat(1001), expectedValid: false, description: 'Exceeds max length' }
  ];

  const emailTests: TestCase[] = [
    { name: 'Valid Email', input: 'user@example.com', expectedValid: true, description: 'Standard email format' },
    { name: 'No @ Symbol', input: 'invalidemail.com', expectedValid: false, description: 'Missing @ symbol' },
    { name: 'Multiple @', input: 'user@@example.com', expectedValid: false, description: 'Multiple @ symbols' },
    { name: 'XSS in Email', input: 'user+<script>@example.com', expectedValid: false, description: 'Script injection' },
    { name: 'Too Long', input: 'a'.repeat(250) + '@example.com', expectedValid: false, description: 'Exceeds length limit' }
  ];

  const urlTests: TestCase[] = [
    { name: 'Valid HTTPS', input: 'https://example.com', expectedValid: true, description: 'Standard HTTPS URL' },
    { name: 'Valid HTTP', input: 'http://example.com/path', expectedValid: true, description: 'HTTP with path' },
    { name: 'JavaScript Protocol', input: 'javascript:alert(1)', expectedValid: false, description: 'JavaScript injection' },
    { name: 'Data URI', input: 'data:text/html,<script>alert(1)</script>', expectedValid: false, description: 'Data URI attack' },
    { name: 'No Protocol', input: 'example.com', expectedValid: false, description: 'Missing protocol' }
  ];

  const arrayTests: TestCase[] = [
    { name: 'Valid Array', input: ['tag1', 'tag2', 'tag3'], expectedValid: true, description: 'Normal tags' },
    { name: 'Too Many Items', input: Array(101).fill('tag'), expectedValid: false, description: 'Exceeds item limit' },
    { name: 'Long Item', input: ['a'.repeat(256)], expectedValid: false, description: 'Item too long' },
    { name: 'XSS in Array', input: ['<script>alert(1)</script>'], expectedValid: false, description: 'Script in array' }
  ];

  const numberTests: TestCase[] = [
    { name: 'Valid Number', input: '42', expectedValid: true, description: 'Integer' },
    { name: 'Valid Decimal', input: '3.14', expectedValid: true, description: 'Decimal number' },
    { name: 'Not a Number', input: 'abc', expectedValid: false, description: 'Non-numeric string' },
    { name: 'Infinity', input: 'Infinity', expectedValid: false, description: 'Special numeric value' },
    { name: 'NaN', input: 'NaN', expectedValid: false, description: 'Not a Number constant' }
  ];

  const jsonTests: TestCase[] = [
    { name: 'Valid JSON', input: '{"key": "value"}', expectedValid: true, description: 'Simple JSON object' },
    { name: 'Valid Array', input: '[1,2,3]', expectedValid: true, description: 'JSON array' },
    { name: 'Invalid JSON', input: '{key: value}', expectedValid: false, description: 'Missing quotes' },
    { name: 'Malformed', input: '{"key": "value"', expectedValid: false, description: 'Unclosed bracket' }
  ];

  const filenameTests: TestCase[] = [
    { name: 'Valid Filename', input: 'document.pdf', expectedValid: true, description: 'Standard filename' },
    { name: 'Path Traversal', input: '../../etc/passwd', expectedValid: false, description: 'Directory traversal' },
    { name: 'Absolute Path', input: '/etc/passwd', expectedValid: false, description: 'Absolute path' },
    { name: 'Special Chars', input: 'file<>:"|?.txt', expectedValid: false, description: 'Invalid characters' },
    { name: 'Too Long', input: 'a'.repeat(256) + '.txt', expectedValid: false, description: 'Exceeds length' }
  ];

  const runTest = (testName: string, tests: TestCase[], validator: Function) => {
    const results = tests.map(test => {
      try {
        const result = validator(test.input);
        const passed = result.isValid === test.expectedValid;
        return {
          ...test,
          result,
          passed,
          message: passed ? 'Pass' : `Expected ${test.expectedValid ? 'valid' : 'invalid'} but got ${result.isValid ? 'valid' : 'invalid'}`
        };
      } catch (error) {
        return {
          ...test,
          result: null,
          passed: !test.expectedValid,
          message: error instanceof Error ? error.message : 'Error occurred'
        };
      }
    });

    setActiveTests(prev => ({ ...prev, [testName]: results }));
    
    const passCount = results.filter(r => r.passed).length;
    const total = results.length;
    
    if (passCount === total) {
      toast.success(`${testName}: All ${total} tests passed!`);
    } else {
      toast.error(`${testName}: ${passCount}/${total} tests passed`);
    }
  };

  const runAllTests = () => {
    runTest('String', stringTests, sanitizeString);
    runTest('Email', emailTests, validateEmail);
    runTest('URL', urlTests, validateUrl);
    runTest('Array', arrayTests, sanitizeArray);
    runTest('Number', numberTests, (val: string) => validateNumber(val));
    runTest('JSON', jsonTests, validateJson);
    runTest('Filename', filenameTests, validateFileName);
    toast.success('All validation tests completed');
  };

  const renderTestResults = (testName: string) => {
    const results = activeTests[testName];
    if (!results) return null;

    return (
      <div className="space-y-2 mt-4">
        {results.map((test: any, idx: number) => (
          <Card key={idx} className={test.passed ? 'border-success' : 'border-destructive'}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {test.passed ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span className="font-medium">{test.name}</span>
                    <Badge variant={test.passed ? 'default' : 'destructive'}>
                      {test.passed ? 'Pass' : 'Fail'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{test.description}</p>
                  <div className="text-xs font-mono bg-muted p-2 rounded">
                    Input: {JSON.stringify(test.input)}
                  </div>
                  {test.result && (
                    <div className="text-xs mt-2">
                      <div className="text-muted-foreground">
                        Valid: {test.result.isValid ? 'Yes' : 'No'}
                      </div>
                      {test.result.errors?.length > 0 && (
                        <div className="text-destructive">
                          Errors: {test.result.errors.join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {test.message}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout>
      
      <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Input Validation Testing</h1>
          <p className="text-muted-foreground">
            Test input validation functions with various attack vectors and edge cases
          </p>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <Button onClick={runAllTests} size="lg">
            <Play className="mr-2 h-4 w-4" />
            Run All Tests
          </Button>
          <Button onClick={() => setActiveTests({})} variant="outline" size="lg">
            <RotateCcw className="mr-2 h-4 w-4" />
            Clear Results
          </Button>
        </div>

        <Tabs defaultValue="automated" className="space-y-6">
          <TabsList>
            <TabsTrigger value="automated">Automated Tests</TabsTrigger>
            <TabsTrigger value="interactive">Interactive Testing</TabsTrigger>
          </TabsList>

          <TabsContent value="automated" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>String Validation</CardTitle>
                  <CardDescription>Test string sanitization and security checks</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => runTest('String', stringTests, sanitizeString)} className="w-full">
                    <Play className="mr-2 h-4 w-4" />
                    Run Tests ({stringTests.length})
                  </Button>
                  {renderTestResults('String')}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Email Validation</CardTitle>
                  <CardDescription>Test email format and security validation</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => runTest('Email', emailTests, validateEmail)} className="w-full">
                    <Play className="mr-2 h-4 w-4" />
                    Run Tests ({emailTests.length})
                  </Button>
                  {renderTestResults('Email')}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>URL Validation</CardTitle>
                  <CardDescription>Test URL format and protocol validation</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => runTest('URL', urlTests, validateUrl)} className="w-full">
                    <Play className="mr-2 h-4 w-4" />
                    Run Tests ({urlTests.length})
                  </Button>
                  {renderTestResults('URL')}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Array Validation</CardTitle>
                  <CardDescription>Test array length and content validation</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => runTest('Array', arrayTests, sanitizeArray)} className="w-full">
                    <Play className="mr-2 h-4 w-4" />
                    Run Tests ({arrayTests.length})
                  </Button>
                  {renderTestResults('Array')}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Number Validation</CardTitle>
                  <CardDescription>Test numeric value validation</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => runTest('Number', numberTests, (val: string) => validateNumber(val))} className="w-full">
                    <Play className="mr-2 h-4 w-4" />
                    Run Tests ({numberTests.length})
                  </Button>
                  {renderTestResults('Number')}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>JSON Validation</CardTitle>
                  <CardDescription>Test JSON parsing and format validation</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => runTest('JSON', jsonTests, validateJson)} className="w-full">
                    <Play className="mr-2 h-4 w-4" />
                    Run Tests ({jsonTests.length})
                  </Button>
                  {renderTestResults('JSON')}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Filename Validation</CardTitle>
                  <CardDescription>Test filename security validation</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => runTest('Filename', filenameTests, validateFileName)} className="w-full">
                    <Play className="mr-2 h-4 w-4" />
                    Run Tests ({filenameTests.length})
                  </Button>
                  {renderTestResults('Filename')}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="interactive" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>String Input</CardTitle>
                  <CardDescription>Test with custom string input</CardDescription>
                </CardHeader>
                <CardContent>
                  <ValidatedInput
                    type="text"
                    value={testInputs.string}
                    onChange={(val) => setTestInputs(prev => ({ ...prev, string: val }))}
                    placeholder="Enter text to validate..."
                    maxLength={1000}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Email Input</CardTitle>
                  <CardDescription>Test with custom email input</CardDescription>
                </CardHeader>
                <CardContent>
                  <ValidatedInput
                    type="email"
                    value={testInputs.email}
                    onChange={(val) => setTestInputs(prev => ({ ...prev, email: val }))}
                    placeholder="Enter email to validate..."
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>URL Input</CardTitle>
                  <CardDescription>Test with custom URL input</CardDescription>
                </CardHeader>
                <CardContent>
                  <ValidatedInput
                    type="url"
                    value={testInputs.url}
                    onChange={(val) => setTestInputs(prev => ({ ...prev, url: val }))}
                    placeholder="Enter URL to validate..."
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Textarea Input</CardTitle>
                  <CardDescription>Test with custom textarea input</CardDescription>
                </CardHeader>
                <CardContent>
                  <ValidatedInput
                    type="textarea"
                    value={testInputs.string}
                    onChange={(val) => setTestInputs(prev => ({ ...prev, string: val }))}
                    placeholder="Enter long text to validate..."
                    maxLength={5000}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DashboardLayout>
  );
}
