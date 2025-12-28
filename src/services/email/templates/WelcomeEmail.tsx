import * as React from "react";
import { Body, Container, Head, Heading, Html, Link, Preview, Section, Text } from "@react-email/components";

export interface WelcomeEmailProps {
  memberName: string;
  clubName?: string;
  dashboardUrl?: string;
}

export function WelcomeEmail({ memberName, clubName = "Santa Barbara Newcomers Club", dashboardUrl = "https://sbnewcomers.org/dashboard" }: WelcomeEmailProps): React.ReactElement {
  return (
    <Html>
      <Head />
      <Preview>Welcome to {clubName}!</Preview>
      <Body style={{ backgroundColor: "#f6f9fc", fontFamily: "sans-serif" }}>
        <Container style={{ backgroundColor: "#fff", padding: "40px 20px", maxWidth: "600px" }}>
          <Heading style={{ color: "#1e40af" }}>Welcome to {clubName}!</Heading>
          <Text>Dear {memberName},</Text>
          <Text>We are thrilled to welcome you! Your membership is now active.</Text>
          <Section style={{ backgroundColor: "#f8fafc", padding: "20px" }}>
            <Text><Link href={dashboardUrl}>Visit your dashboard</Link> to get started.</Text>
          </Section>
          <Text>The {clubName} Team</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default WelcomeEmail;
