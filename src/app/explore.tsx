import { Redirect } from 'expo-router';
import React from 'react';

// This route is unused — redirect to home
export default function ExplorePage() {
  return <Redirect href="/" />;
}
