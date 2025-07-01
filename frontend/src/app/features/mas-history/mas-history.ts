import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mas-history',
  standalone: true,
  imports: [CommonModule], 
  templateUrl: './mas-history.html',
  styleUrls: ['./mas-history.css'],
})
export class MasHistoryComponent implements OnInit {
  transactions: any[] = [];

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit() {
    const userName = localStorage.getItem('user_name');
    // console.log(userName);
    if (userName) {
      this.http
        .get<any[]>(`http://localhost:8080/api/mas-history/user/${userName}`)
        .subscribe({
          next: (data) => {
            this.transactions = data;
            console.log(data);
          },
          error: (err) => {
            console.error('Failed to fetch MAS history:', err);
          },
        });
    }
  }
  getTotalIssues(issueCounts: any): number {
    if (!issueCounts) return 0;
    return Object.values(issueCounts).reduce(
      (sum: number, val: any) => sum + Number(val),
      0
    );
  }
  viewDetails(tx: any) {
    this.router.navigate(['/analysis-results', tx._id]); //fromchatbot+data
  }
}
