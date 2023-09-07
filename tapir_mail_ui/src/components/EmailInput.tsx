import React, { useState, useEffect, useRef } from "react";
import { Form, Badge, Alert } from "react-bootstrap";

interface EmailInputProps {
  onEmailListChange: (emails: string[]) => void;
}

const EmailInput: React.FC<EmailInputProps> = ({ onEmailListChange }) => {
  const [inputValue, setInputValue] = useState<string>("");
  const [emailList, setEmailList] = useState<string[]>([]);
  const [isValidEmail, setIsValidEmail] = useState<boolean>(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    onEmailListChange(emailList);
  }, [emailList]);

  const validateEmail = (email: string) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ([" ", ",", ";", "Enter"].includes(e.key)) {
      e.preventDefault();
      addEmail(inputValue.trim());
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const emails = pastedData.split(/[ ,;]+/);
    const newEmails = [...emailList];
    emails.forEach((email) => {
      const trimmedEmail = email.trim();
      if (validateEmail(trimmedEmail) && !newEmails.includes(trimmedEmail)) {
        newEmails.push(trimmedEmail);
      }
    });
    setEmailList(newEmails);
  };

  const addEmail = (email: string) => {
    if (email) {
      if (validateEmail(email)) {
        setIsValidEmail(true);
        if (!emailList.includes(email)) {
          setEmailList([...emailList, email]);
        }
        setInputValue("");
      } else {
        setIsValidEmail(false);
        setInputValue(email);
      }
    }
  };

  const removeEmail = (email: string) => {
    setEmailList(emailList.filter((e) => e !== email));
  };

  const handleBlur = () => {
    addEmail(inputValue.trim());
  };

  return (
    <div>
      {!isValidEmail && <Alert variant="warning">Invalid email address</Alert>}
      {emailList.map((email, index) => (
        <Badge
          title="Click to remove"
          style={{
            cursor: "pointer",
            marginRight: "0.5em",
            marginBottom: "0.5em",
          }}
          key={index}
          className="mr-2"
          onClick={() => removeEmail(email)}
        >
          {email}
        </Badge>
      ))}
      <Form>
        <Form.Control
          style={{ marginTop: "1em" }}
          as="input"
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          ref={inputRef}
          placeholder="Empfänger hinzufügen"
          onBlur={handleBlur}
        />
      </Form>
    </div>
  );
};

export default EmailInput;
