function hsv2rgb(hsv)
{
    var h, s, v;
    [h, s, v] = hsv;
    var hPrime = 3 * h / Math.PI;
    var c = s * v;
    var x = c * (1 - Math.abs((hPrime % 2) - 1));
    var m = v - c;
    var r = m, g = m, b = m;
    switch (Math.floor(hPrime))
    {
    case 0:
        r += c;
        g += x;
        break;
    case 1:
        r += x;
        g += c;
        break;
    case 2:
        g += c;
        b += x;
        break;
    case 3:
        g += x;
        b += c;
        break;
    case 4:
        r += x;
        b += c;
        break;
    case 5:
        r += c;
        b += x;
        break;
    }
    return [r, g, b];
}

function rgb2hsv(rgb)
{
    var r, g, b;
    [r, g, b] = rgb;
    var M = _.max(rgb);
    var m = _.min(rgb);
    var c = M - m;
    var v = M;
    var s;
    if (M > 0)
    {
        s = c / v;
    }
    else
    {
        s = 0;
    }
    var hPrime;
    if (c === 0)
    {
        hPrime = 0;
    }
    else if (r === M)
    {
        hPrime = 0 + (g - b) / c;
    }
    else if (g === M)
    {
        hPrime = 2 + (b - r) / c;
    }
    else
    {
        hPrime = 4 + (r - g) / c;
    }
    var h = Math.wrap(hPrime, 0, 6) * Math.PI / 3;
    return [h, s, v];
}

function interpolateHSV(x, hsv1, hsv2)
{
    var h1, s1, v1, h2, s2, v2;
    [h1, s1, v1] = hsv1;
    [h2, s2, v2] = hsv2;
    return [
        Math.wrap(Math.interpolateAngle(x, h1, h2), 0, 2 * Math.PI),
        Math.lerp(x, s1, s2),
        Math.lerp(x, v1, v2)
    ];
}

function rgb2css(rgb)
{
    var sb = ['#'];
    for (var i = 0; i < 3; i++)
    {
        var x = Math.floor(rgb[i] * 0xff);
        if (x < 0x10) sb.push('0');
        sb.push(x.toString(16));
    }
    return sb.join('');
}

/**
 * Handles a subset of CSS color specs.
 */
function css2rgb(css)
{
    var rgb = [];
    if (css.length === 4) // assume #xxx
    {
        for (var i = 1; i < 4; i++)
        {
            rgb.push(parseInt(css[i], 16) / 15.0);
        }
    }
    else // assume #xxxxxx
    {
        for (var i = 1; i < 7; i++)
        {
            rgb.push(parseInt(css.slice(i, i + 2), 16) / 255.0);
        }
    }
    return rgb;
}
