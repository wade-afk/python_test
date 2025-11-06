// Cloudflare Pages Function - API 키를 서버 사이드에서만 사용
export const onRequestPost: PagesFunction = async ({ request, env }) => {
  try {
    // CORS 헤더 설정
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // OPTIONS 요청 처리 (CORS preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // API 키 확인 - 여러 가능한 환경 변수 이름 시도
    const envAny = env as any;
    
    // 디버깅을 위한 환경 변수 정보 (모든 키 확인)
    const envKeys = Object.keys(env || {});
    const allEnvKeys = envKeys.length > 0 ? envKeys.join(', ') : 'No keys found';
    
    // 여러 방식으로 API 키 접근 시도
    const apiKey = 
      env.OPENAI_API_KEY || 
      envAny.OPENAI_API_KEY || 
      envAny.VITE_OPENAI_API_KEY ||
      (env as Record<string, string>)['OPENAI_API_KEY'] ||
      (env as Record<string, string>)['VITE_OPENAI_API_KEY'];
    
    if (!apiKey) {
      console.error('API key not found.');
      console.error('Available env keys:', allEnvKeys);
      console.error('Env object:', env);
      
      return new Response(
        JSON.stringify({ 
          error: 'API key not configured',
          details: 'Please set OPENAI_API_KEY in Cloudflare Pages environment variables',
          debug: {
            checkedKeys: ['OPENAI_API_KEY', 'VITE_OPENAI_API_KEY'],
            availableKeys: envKeys,
            allEnvKeys: allEnvKeys,
            envType: typeof env,
            hasEnv: !!env,
            envKeysCount: envKeys.length
          },
          instructions: [
            '📖 Full guide: See CLOUDFLARE_SETUP.md in the repository',
            '',
            'Quick steps:',
            '1. Go to https://dash.cloudflare.com → Pages → Your Project',
            '2. Settings → Variables → Add variable',
            '3. Name: OPENAI_API_KEY (NO VITE_ prefix!)',
            '4. Value: Your API key (e.g., sk-proj-...)',
            '5. Select both Production AND Preview',
            '6. Save',
            '7. Deployments tab → Redeploy latest deployment',
            '',
            '⚠️ CRITICAL:',
            '- Variable name: exactly "OPENAI_API_KEY"',
            '- After adding, you MUST redeploy!',
            '- Check browser console Debug info → allEnvKeys',
            '- If OPENAI_API_KEY is not in the list, it\'s not set correctly'
          ]
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 요청 body 파싱
    const body = await request.json();
    const { problems, userCodes } = body;

    if (!problems || !userCodes || !Array.isArray(problems) || !Array.isArray(userCodes)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // OpenAI API 호출
    const prompt = `
당신은 Python 프로그래밍 전문가입니다. 다음 ${problems.length}개의 문제에 대한 학생들의 코드를 평가해주세요.

${problems.map((problem: any, index: number) => `
**문제 ${index + 1}: ${problem.title}**
설명: ${problem.description}
학생 코드:
\`\`\`python
${userCodes[index] || '코드 없음'}
\`\`\`
`).join('\n\n')}

각 문제에 대해 다음 JSON 형식으로 응답해주세요. 반드시 "results" 키를 가진 객체로 응답하세요:

{
  "results": [
    {
      "output": "코드 실행 결과 또는 오류 메시지",
      "isCorrect": true/false,
      "feedback": "간단한 피드백",
      "syntaxError": null 또는 {"line": 숫자, "message": "오류 메시지"}
    }
  ]
}

JSON만 응답하고 다른 텍스트는 포함하지 마세요. 반드시 ${problems.length}개의 결과를 포함해야 합니다.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a Python programming expert. Evaluate student code and respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to evaluate code', details: errorText }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();
    const jsonString = data.choices[0]?.message?.content?.trim() || '{}';
    const parsed = JSON.parse(jsonString);

    // OpenAI는 JSON 객체를 반환할 수 있으므로 배열로 변환
    let results: any[] = [];
    if (Array.isArray(parsed)) {
      results = parsed;
    } else if (parsed.results && Array.isArray(parsed.results)) {
      results = parsed.results;
    } else if (parsed.evaluations && Array.isArray(parsed.evaluations)) {
      results = parsed.evaluations;
    } else {
      results = [parsed];
    }

    // 결과 개수가 맞지 않으면 빈 결과로 채움
    if (results.length !== problems.length) {
      console.warn(`Expected ${problems.length} results, got ${results.length}`);
      results = problems.map((_: any, index: number) => ({
        output: results[index]?.output || '',
        isCorrect: results[index]?.isCorrect || false,
        feedback: results[index]?.feedback || '평가 결과를 생성할 수 없습니다.',
        syntaxError: results[index]?.syntaxError || null,
      }));
    }

    // 결과를 올바른 형식으로 변환
    const evaluationResults = results.map((result: any) => ({
      output: result.output || '',
      isCorrect: result.isCorrect || false,
      feedback: result.feedback || '',
      syntaxError: result.syntaxError || null,
    }));

    return new Response(
      JSON.stringify(evaluationResults),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Evaluation error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

