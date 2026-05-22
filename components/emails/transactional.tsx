import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";

interface WaitlistEmailProps {
  name: string;
  business: string;
  email: string;
  websiteOrHandle: string;
  interests: string[];
  postsPerMonth: string;
  message: string;
}

export const WaitlistEmail: React.FC<Readonly<WaitlistEmailProps>> = ({
  name,
  business,
  email,
  websiteOrHandle,
  interests,
  postsPerMonth,
  message,
}) => (
  <Html>
    <Head />
    <Body style={main}>
      <Preview>New contact list</Preview>
      <Container style={container}>
        <Heading style={h1}>New Talexia.ai contact submission</Heading>
        <Text style={text}>Name: {name}</Text>
        <Text style={text}>Business: {business}</Text>
        <Text style={text}>Email: {email}</Text>
        <Text style={text}>Website or Handle: {websiteOrHandle}</Text>
        <Text style={text}>Interests: {interests.join(", ")}</Text>
        <Text style={text}>Post per month: {postsPerMonth}</Text>
        <Text style={text}>Message: {message}</Text>
      </Container>
    </Body>
  </Html>
);

export default WaitlistEmail;

const main = {
  backgroundColor: "#000000",
  margin: "0 auto",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
};

const container = {
  margin: "auto",
  padding: "96px 20px 64px",
};

const h1 = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "40px",
  margin: "0 0 20px",
};

const text = {
  color: "#aaaaaa",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "0 0 40px",
};
