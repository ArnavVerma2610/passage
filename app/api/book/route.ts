import { type NextRequest, NextResponse } from 'next/server';
import { DESTINATIONS } from '@/lib/data';
import type { BookingResult, BookingType } from '@/lib/types';

function ref(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

interface BookingRequestBody {
  type: BookingType;
  destinationId: string;
}

export async function POST(req: NextRequest) {
  const { type, destinationId } = (await req.json()) as BookingRequestBody;

  const dest = DESTINATIONS.find(d => d.id === destinationId);
  if (!dest) {
    return NextResponse.json({ error: 'Destination not found' }, { status: 404 });
  }

  await delay(2000 + Math.random() * 1000);

  const issuedAt = new Date().toISOString();

  let result: BookingResult;

  if (type === 'flight') {
    const seat = `${Math.floor(Math.random() * 30) + 1}${String.fromCharCode(
      65 + Math.floor(Math.random() * 6),
    )}`;

    result = {
      bookingRef: ref('MMT'),
      issuedAt,
      type,
      details: {
        from: dest.travelPlan.flights.from,
        to: dest.travelPlan.flights.to,
        airline: dest.travelPlan.flights.airline,
        duration: dest.travelPlan.flights.duration,
        price: dest.travelPlan.flights.price,
        seat,
        class: 'Economy',
      },
    };
  } else if (type === 'hotel') {
    const hotel = dest.travelPlan.hotels[0];
    result = {
      bookingRef: ref('MMT'),
      issuedAt,
      type,
      details: {
        name: hotel.name,
        hotelType: hotel.type,
        pricePerNight: hotel.price,
        nights: 7,
        confirmationCode: ref('HTL'),
      },
    };
  } else {
    result = {
      bookingRef: ref('VISA'),
      issuedAt,
      type,
      details: {
        country: dest.country,
        processingTime: '5–14 business days',
        applicationType: 'e-Visa',
        applicationId: ref('APP'),
        status: 'Submitted',
      },
    };
  }

  return NextResponse.json(result);
}
