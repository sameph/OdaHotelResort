import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

export interface BookingConfirmationProps {
  guestName: string;
  txRef: string;
  amount: number; // ETB
  checkIn: string;
  checkOut: string;
  roomName: string;
  cancelUrl?: string;
}

export const BookingConfirmation = ({
  guestName,
  txRef,
  amount,
  checkIn,
  checkOut,
  roomName,
}: BookingConfirmationProps) => (
  <Html>
    <Head />
    <Preview>Your booking is confirmed – {roomName}</Preview>
    <Body style={styles.body}>
      <Img
        src="https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/hero-resort.jpg"
        alt="ODA Resort"
        width="600"
        style={styles.headerImg}
      />
      <Container style={styles.container}>
        <Heading style={styles.h2}>Booking Confirmation</Heading>
        <Text style={styles.paragraph}>Hi <strong>{guestName}</strong>,</Text>
        <Text style={styles.paragraph}>
          Your payment of <strong>ETB {amount.toLocaleString()}</strong> was processed successfully. Your reservation is now confirmed.
        </Text>
        <Section style={styles.card}>
          <Text style={styles.cardLabel}>Reference ID:</Text>
          <Text style={styles.cardValue}>{txRef}</Text>
          <Text style={styles.cardLabel}>Room:</Text>
          <Text style={styles.cardValue}>{roomName}</Text>
          <Text style={styles.cardLabel}>Check‑in:</Text>
          <Text style={styles.cardValue}>{checkIn}</Text>
          <Text style={styles.cardLabel}>Check‑out:</Text>
          <Text style={styles.cardValue}>{checkOut}</Text>
        </Section>
        <Section style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            Please contact the Oda Hotel team to cancel your booking.
          </Text>
        </Section>
        <Text style={styles.footer}>We look forward to welcoming you to ODA Resort Hotel!</Text>
      </Container>
    </Body>
  </Html>
);

const styles = {
  body: {
    fontFamily: 'Arial, Helvetica, sans-serif',
    backgroundColor: '#f5f5f5',
    margin: 0,
    padding: 0,
  },
  headerImg: {
    width: '100%',
    maxHeight: 200,
    objectFit: 'cover' as const,
  },
  container: {
    backgroundColor: '#ffffff',
    margin: '40px auto',
    padding: '20px 40px',
    borderRadius: 8,
    maxWidth: 560,
  },
  h2: {
    color: '#0e4b3c',
    marginBottom: 24,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: '22px',
    color: '#333333',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fcf9f2',
    border: '1px solid #e2d8c3',
    borderRadius: 4,
    padding: '20px',
  },
  cardLabel: {
    fontSize: 12,
    color: '#555555',
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 14,
    marginBottom: 12,
    fontWeight: 500 as const,
  },
  noticeBox: {
    marginTop: 28,
    padding: '16px 20px',
    backgroundColor: '#fcf8f0',
    border: '1px dashed #dcd0b8',
    borderRadius: 6,
    textAlign: 'center' as const,
  },
  noticeText: {
    margin: 0,
    fontSize: 13,
    lineHeight: '20px',
    color: '#5a4d3a',
    fontWeight: 500 as const,
  },
  footer: {
    fontSize: 12,
    color: '#666666',
    marginTop: 32,
    textAlign: 'center' as const,
  },
};

export default BookingConfirmation;

