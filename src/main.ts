import './style.css'
import { Octokit } from '@octokit/core'
import { paginateRest } from "@octokit/plugin-paginate-rest";

import { Chart } from 'chart.js/auto';
import 'chartjs-adapter-date-fns';

const MyOctokit = Octokit.plugin(paginateRest);

const octokit = new MyOctokit({})

async function updateGraph() {
  const owner = (document.getElementById('owner') as HTMLInputElement).value;
  const repo = (document.getElementById('repo') as HTMLInputElement).value;
  const issue_number = parseInt((document.getElementById('issue_number') as HTMLInputElement).value);

  if (!owner || !repo || !issue_number) {
    alert('Please fill in all fields');
    return;
  }

  // Fetch issue details
  const issueDetails = await octokit.request("GET /repos/{owner}/{repo}/issues/{issue_number}", {
    owner,
    repo,
    issue_number,
  });

  // Extract issue title, HTML URL, and creation timestamp
  const { title, html_url, created_at } = issueDetails.data;

  // Display issue information
  displayIssueInformation(title, html_url, created_at);

  const reactionList = await octokit.paginate("GET /repos/{owner}/{repo}/issues/{issue_number}/reactions", {
    owner,
    repo,
    issue_number,
  });

  const reactions = reactionList.reduce((acc, reaction) => ({
    ...acc,
    [reaction.content]: [...(acc[reaction.content] || []), reaction]
  }), {} as Record<string, typeof reactionList>);

  const labels = Object.keys(reactions); 
  const datasets = labels.map(label => {
    return {
      label: label,
      data: reactions[label].map((reaction, i) => ({ x: reaction.created_at, y: i })), 
      fill: false,
      borderColor: getRandomColor(), // A function to generate a random color for each line
    };
  });

  const ctx = (document.getElementById('myChart')! as HTMLCanvasElement).getContext('2d')!;
  new Chart(ctx, {
    type: 'line',
    data: {
      datasets: datasets,
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        },
        x: {
          type: 'time',
          time: {
            displayFormats: {
              quarter: 'MMM YYYY'
            }
          }
        }
      }
    }
  });
  document.querySelector<HTMLDivElement>('#app')!.innerHTML = 'loaded'
}

function displayIssueInformation(title: string, html_url: string, created_at: string): void {
  const issueInfoDiv = document.createElement('div');
  issueInfoDiv.id = 'issue-information';
  issueInfoDiv.innerHTML = `
    <h2>${title}</h2>
    <p>Created at: ${Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeStyle: 'long' }).format(new Date(created_at))}</p>
    <a href="${html_url}" target="_blank">View on GitHub</a>
  `;
  document.body.insertBefore(issueInfoDiv, document.getElementById('app'));
}

window.addEventListener('load', () => {
  document.querySelector('form')!.addEventListener('submit', (e) => {
    e.preventDefault();
    updateGraph()
  });
});

function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
