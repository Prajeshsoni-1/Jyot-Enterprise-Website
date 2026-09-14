<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
  xmlns:html="http://www.w3.org/TR/REC-html40"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
      <head>
        <title>XML Sitemap — Jyot Enterprise</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style type="text/css">
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #1e293b;
            background-color: #f8fafc;
            margin: 0;
            padding: 0;
            font-size: 14px;
            line-height: 1.5;
          }
          .container {
            max-width: 1100px;
            margin: 0 auto;
            padding: 40px 24px 60px;
          }
          .header {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 32px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            margin-bottom: 24px;
          }
          .header h1 {
            margin: 0 0 8px;
            font-size: 26px;
            font-weight: 800;
            color: #0f172a;
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .tag {
            font-size: 12px;
            background: #fff1ed;
            color: #F04A23;
            padding: 3px 10px;
            border-radius: 9999px;
            font-weight: 700;
            border: 1px solid #ffddd4;
          }
          .header p {
            margin: 0;
            color: #64748b;
            font-size: 14px;
            max-width: 720px;
          }
          .notice-bar {
            margin-top: 20px;
            padding: 14px 18px;
            background-color: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 12px;
          }
          .notice-bar p {
            color: #1e40af;
            margin: 0;
            font-size: 13px;
          }
          .btn {
            display: inline-block;
            background-color: #F04A23;
            color: #ffffff;
            text-decoration: none;
            padding: 8px 16px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 13px;
            transition: background-color 0.15s;
          }
          .btn:hover {
            background-color: #d83b16;
          }
          .table-wrapper {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          }
          table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
          }
          th {
            background-color: #f1f5f9;
            color: #475569;
            padding: 14px 18px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 1px solid #e2e8f0;
          }
          td {
            padding: 12px 18px;
            border-bottom: 1px solid #f1f5f9;
            color: #334155;
            font-size: 13px;
            word-break: break-all;
          }
          tr:last-child td {
            border-bottom: none;
          }
          tr:hover td {
            background-color: #f8fafc;
          }
          a.loc-link {
            color: #0f172a;
            text-decoration: none;
            font-weight: 500;
          }
          a.loc-link:hover {
            color: #F04A23;
            text-decoration: underline;
          }
          .badge-prio {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 11px;
            background: #e2e8f0;
            color: #334155;
          }
          .badge-prio.high {
            background: #dcfce7;
            color: #15803d;
          }
          .footer {
            margin-top: 24px;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>
              XML Sitemap 
              <span class="tag">Search Engine Feed</span>
            </h1>
            <p>
              This is the machine-readable XML sitemap index generated for Googlebot, Bing, and web search indexing protocols.
            </p>
            <div class="notice-bar">
              <p>
                <strong>Looking for the human-navigable sitemap?</strong> Visit our interactive HTML sitemap with categorized business areas, tools, and calculators.
              </p>
              <a href="/sitemap" class="btn">View Visual HTML Sitemap →</a>
            </div>
          </div>

          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style="width: 55px;">#</th>
                  <th>URL (Location)</th>
                  <th style="width: 120px; text-align: center;">Priority</th>
                  <th style="width: 130px; text-align: center;">Frequency</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="sitemap:urlset/sitemap:url">
                  <tr>
                    <td style="color: #94a3b8; font-family: monospace;">
                      <xsl:value-of select="position()"/>
                    </td>
                    <td>
                      <xsl:variable name="itemURL">
                        <xsl:value-of select="sitemap:loc"/>
                      </xsl:variable>
                      <a href="{$itemURL}" class="loc-link" target="_blank">
                        <xsl:value-of select="sitemap:loc"/>
                      </a>
                    </td>
                    <td style="text-align: center;">
                      <xsl:choose>
                        <xsl:when test="sitemap:priority &gt;= 0.8">
                          <span class="badge-prio high"><xsl:value-of select="sitemap:priority"/></span>
                        </xsl:when>
                        <xsl:otherwise>
                          <span class="badge-prio"><xsl:value-of select="sitemap:priority"/></span>
                        </xsl:otherwise>
                      </xsl:choose>
                    </td>
                    <td style="text-align: center; text-transform: capitalize; color: #64748b; font-size: 12px;">
                      <xsl:value-of select="sitemap:changefreq"/>
                    </td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p>Jyot Enterprise &bull; B-616 The Landmark, Kudasan, Gandhinagar, Gujarat &bull; Powered by TanStack Start</p>
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
