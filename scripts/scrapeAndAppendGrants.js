// scripts/scrapeAndAppendGrants.js
import { load as cheerioLoad } from 'cheerio';
import axios from 'axios';
import fs from 'fs';

const url = 'https://www2.fundsforngos.org/category/latest-funds-for-ngos/'; // Updated to a real URL

async function scrapeGrants() {
  try {
    // Fetch the webpage with a User-Agent header to mimic a browser
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000 // 10-second timeout
    });
    const $ = cheerioLoad(data);

    // Array to store new grants
    const newGrants = [];

    // Scrape grant data from the page
    $('article.post').each((index, element) => {
      const title = $(element).find('.entry-title a').text().trim();
      const description = $(element).find('.entry-content p').text().trim();
      const deadlineText = $(element).find('.deadline').text().trim().replace('Deadline: ', '');
      const deadline = new Date(deadlineText);
      const applyLink = $(element).find('.entry-title a').attr('href');

      newGrants.push({
        title: title || `Grant ${index + 1}`,
        description: description || 'No description available',
        amount: 1000000, // Default amount (update if available)
        eligibility: 'NGOs and community organizations', // Default eligibility
        deadline: deadline.toISOString().split('T')[0] || '2025-12-31',
        source: url,
        applyLink: applyLink || `${url}/apply-${index + 1}`,
      });
    });

    // Read the existing grants from initialGrants.json
    const existingGrants = JSON.parse(fs.readFileSync('C:/Users/shahi/ecothon/scripts/initialGrants.json', 'utf-8'));

    // Append new grants to existing ones (avoid duplicates by title and source)
    const updatedGrants = [...existingGrants];
    newGrants.forEach((newGrant) => {
      const exists = updatedGrants.some(
        (grant) => grant.title === newGrant.title && grant.source === newGrant.source
      );
      if (!exists) {
        updatedGrants.push(newGrant);
      }
    });

    // Write the updated grants back to initialGrants.json
    fs.writeFileSync('C:/Users/shahi/ecothon/scripts/initialGrants.json', JSON.stringify(updatedGrants, null, 2));
    console.log(`Successfully appended ${newGrants.length} new grants. Total grants: ${updatedGrants.length}`);
  } catch (error) {
    console.error('Error scraping grants:', error.message);
    if (error.code === 'ETIMEDOUT') {
      console.error('Connection timed out. Check your internet or try again later.');
    } else if (error.response && error.response.status === 404) {
      console.error('URL not found. Please check the URL and selectors.');
    }
  }
}

scrapeGrants();