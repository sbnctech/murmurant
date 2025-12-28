import * as React from "react";
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";

export interface PasswordResetEmailProps {
  memberName: string;
  resetUrl: string;
  expiresIn?: string;
}

export function PasswordResetEmail({ memberName, resetUrl, expiresIn = "1 hour" }: PasswordResetEmailProps): React.ReactElement {
  return (
    <Html>
      <Head />
      <Preview>Reset your password</Preview>
      <Body style={{ backgroundColor: "#f6f9fc", fontFamily: "sans-serif" }}>
        <Container style={{ backgroundColor: "#fff", padding: "40px 20px", maxWidth: "600px" }}>
          <Heading style={{ color: "#1e40af" }}>Password Reset</Heading>
          <Text>Hi {memberName},</Text>
          <Text>Click the button below to reset your password:</Text>
          <Section style={{ textAlign: "center", margin: "30px 0" }}>
            <Button href={resetUrl} style={{ backgroundColor: "#1e40af", color: "#fff", padding: "14px 30px" }}>Reset Password</Button>
          </Section>
          <Text>This link expires in {expiresIn}.</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default PasswordResetEmail;
