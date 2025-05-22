var raytraceFS = `
struct Ray {
	vec3 pos;
	vec3 dir;
};

struct Material {
	vec3  k_d;	// diffuse coefficient
	vec3  k_s;	// specular coefficient
	float n;	// specular exponent
};

struct Sphere {
	vec3     center;
	float    radius;
	Material mtl;
};

struct Light {
	vec3 position;
	vec3 intensity;
};

struct HitInfo {
	float    t;
	vec3     position;
	vec3     normal;
	Material mtl;
};

uniform Sphere spheres[ NUM_SPHERES ];
uniform Light  lights [ NUM_LIGHTS  ];
uniform samplerCube envMap;
uniform int bounceLimit;

bool IntersectRay( inout HitInfo hit, Ray ray );

// Shades the given point and returns the computed color.
vec3 Shade( Material mtl, vec3 position, vec3 normal, vec3 view )
{
	vec3 color = vec3(0.0);
	for ( int i = 0; i < NUM_LIGHTS; ++i ) {
		vec3 lightDir = normalize(lights[i].position - position);

		// Shadow ray
		Ray shadowRay;
		shadowRay.pos = position + 0.01 * normal;
		shadowRay.dir = lightDir;
		HitInfo shadowHit;
		if (IntersectRay(shadowHit, shadowRay)) {
			float lightDist = length(lights[i].position - position);
			if (shadowHit.t < lightDist) {
				continue;
			}
		}

		vec3 h = normalize(lightDir + view);
		float diff = max(dot(normal, lightDir), 0.0);
		float spec = pow(max(dot(normal, h), 0.0), mtl.n);
		color += lights[i].intensity * (mtl.k_d * diff + mtl.k_s * spec);
	}
	return color;
}


// Intersects the given ray with all spheres in the scene
// and updates the given HitInfo using the information of the sphere
// that first intersects with the ray.
// Returns true if an intersection is found.
bool IntersectRay( inout HitInfo hit, Ray ray )
{
	hit.t = 1e30;
	bool foundHit = false;
	for ( int i = 0; i < NUM_SPHERES; ++i ) {
		vec3 oc = ray.pos - spheres[i].center;
		float a = dot(ray.dir, ray.dir);
		float b = 2.0 * dot(ray.dir, oc);
		float c = dot(oc, oc) - spheres[i].radius * spheres[i].radius;
		float discriminant = b * b - 4.0 * a * c;
		if (discriminant > 0.0) {
			float sqrtD = sqrt(discriminant);
			float t1 = (-b - sqrtD) / (2.0 * a);
			float t2 = (-b + sqrtD) / (2.0 * a);
			float t = (t1 > 0.0) ? t1 : ((t2 > 0.0) ? t2 : -1.0);
			if (t > 0.0 && t < hit.t) {
				hit.t = t;
				hit.position = ray.pos + t * ray.dir;
				hit.normal = normalize(hit.position - spheres[i].center);
				hit.mtl = spheres[i].mtl;
				foundHit = true;
			}
		}
	}
	return foundHit;
}


// Given a ray, returns the shaded color where the ray intersects a sphere.
// If the ray does not hit a sphere, returns the environment color.
vec4 RayTracer( Ray ray )
{
	HitInfo hit;
	if ( IntersectRay( hit, ray ) ) {
		vec3 view = normalize( -ray.dir );
		vec3 clr = Shade( hit.mtl, hit.position, hit.normal, view );

		// Compute reflections
		vec3 k_s = hit.mtl.k_s;
		for ( int bounce = 0; bounce < MAX_BOUNCES; ++bounce ) {
			if ( bounce >= bounceLimit ) break;
			if ( k_s.r + k_s.g + k_s.b <= 0.0 ) break;

			// Reflection ray
			Ray r;
			r.pos = hit.position + 0.001 * hit.normal;
			r.dir = reflect( -view, hit.normal );

			HitInfo h;
			if ( IntersectRay( h, r ) ) {
				view = normalize(-r.dir);
				vec3 reflection = Shade( h.mtl, h.position, h.normal, view );
				clr += k_s * reflection;
				k_s *= h.mtl.k_s;
				hit = h;
			} else {
				clr += k_s * textureCube( envMap, r.dir.xzy ).rgb;
				break;
			}
		}
		return vec4( clr, 1 );
	} else {
		return vec4( textureCube( envMap, ray.dir.xzy ).rgb, 0 );
	}
}
`;
